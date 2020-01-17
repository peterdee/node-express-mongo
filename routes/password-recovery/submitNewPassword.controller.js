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
    const { code = '', newPassword = '' } = req.body;
    const expected = [
      { field: 'code', type: DATA_TYPES.string, value: code },
      { field: 'newPassword', type: DATA_TYPES.string, value: newPassword },
    ];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      return data(req, res, rs[400], sm.missingData, { missing });
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      return data(req, res, rs[400], sm.invalidData, { invalid });
    }

    // find the Password Recovery Record
    const passwordRecoveryRecord = await db.PasswordRecoveryCode.findOne({
      code,
      isDeleted: false,
    });
    if (!passwordRecoveryRecord) {
      return basic(req, res, rs[400], 'INVALID_RECOVERY_CODE');
    }
    if (passwordRecoveryRecord.expirationDate < utils.getSeconds()) {
      return basic(req, res, rs[400], 'EXPIRED_RECOVERY_CODE');
    }

    // load Password Record and User Record
    const [passwordRecord, userRecord] = await Promise.all([
      db.Password.findOne({
        userId: passwordRecoveryRecord.userId,
        isDeleted: false,
      }),
      db.User.findOne({
        _id: passwordRecoveryRecord.userId,
        isDeleted: false,
      }),
    ]);
    if (!(passwordRecord && userRecord)) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // generate a new access image, create a new password hash, mark records as deleted
    const query = { userId: userRecord.id, isDeleted: false };
    const seconds = utils.getSeconds();
    const update = { isDeleted: true, updated: seconds };
    const [accessImage, hash] = await Promise.all([
      utils.generateImage(userRecord.id),
      bcrypt.hash(newPassword, 10),
      db.AccessImage.updateMany(query, update),
      db.PasswordRecoveryCode.updateMany(query, update),
      db.RefreshToken.updateMany(query, update),
    ]);

    // create a new Access Image Record
    const AccessImage = new db.AccessImage({
      userId: userRecord.id,
      image: accessImage,
      created: seconds,
      updated: seconds,
    });

    // store new access image, update password
    await Promise.all([
      AccessImage.save(),
      db.Password.updateOne(
        {
          id: passwordRecord.id,
        },
        {
          hash,
          updated: seconds,
        },
      ),
    ]);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
