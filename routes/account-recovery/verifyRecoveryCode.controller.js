const bcrypt = require('bcrypt');

const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const db = require('../../db');
const utils = require('../../services/utilities');

const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Send recovery email
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const { code = '' } = req.body;
    const expected = [{ field: 'code', type: DATA_TYPES.string, value: code }];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      return data(req, res, rs[400], sm.missingData, { missing });
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      return data(req, res, rs[400], sm.invalidData, { invalid });
    }

    // find the Account Recovery Record
    const accountRecoveryRecord = await db.AccountRecoveryCode.findOne({
      code,
      isDeleted: false,
    });
    if (!accountRecoveryRecord) {
      return basic(req, res, rs[400], 'INVALID_RECOVERY_CODE');
    }
    if (accountRecoveryRecord.expirationDate < utils.getSeconds()) {
      return basic(req, res, rs[400], 'EXPIRED_RECOVERY_CODE');
    }

    // load User Record
    const userRecord = await db.User.findOne({
      _id: accountRecoveryRecord.userId,
      accountStatus: config.ACCOUNT_STATUSES.blocked,
      isDeleted: false,
    });
    if (!userRecord) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // generate a new access image, mark records as deleted
    const query = { userId: userRecord.id, isDeleted: false };
    const seconds = utils.getSeconds();
    const update = { isDeleted: true, updated: seconds };
    const [accessImage] = await Promise.all([
      utils.generateImage(userRecord.id),
      db.AccessImage.updateMany(query, update),
      db.AccountRecoveryCode.updateMany(query, update),
      db.RefreshToken.updateMany(query, update),
    ]);

    // create a new Access Image Record
    const AccessImage = new db.AccessImage({
      userId: userRecord.id,
      image: accessImage,
      created: seconds,
      updated: seconds,
    });

    // store new access image, update User record
    await Promise.all([
      AccessImage.save(),
      db.User.updateOne(
        {
          _id: userRecord.id,
        },
        {
          accountStatus: config.ACCOUNT_STATUSES.active,
          failedLoginAttempts: 0,
          updated: seconds,
        },
      ),
    ]);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
