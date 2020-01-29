const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const { createAccountRecoveryTemplate } = require('../../services/templates');
const db = require('../../db');
const mailer = require('../../services/mailer');
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
    const { email = '' } = req.body;
    const expected = [{ field: 'email', type: DATA_TYPES.string, value: email }];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      return data(req, res, rs[400], sm.missingData, { missing });
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      return data(req, res, rs[400], sm.invalidData, { invalid });
    }

    // find user record by email
    const userRecord = await db.User.findOne({
      accountStatus: config.ACCOUNT_STATUSES.blocked,
      email,
      isDeleted: false,
    });
    if (!userRecord) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // invalidate all of the previously sent codes
    const seconds = utils.getSeconds();
    await db.AccountRecoveryCode.updateMany(
      {
        isDeleted: false,
        userId: userRecord.id,
      },
      {
        isDeleted: true,
        updated: seconds,
      },
    );

    // create a new Password Recovery Code record
    const code = utils.generateString(32);
    const AccountRecoveryCode = new db.AccountRecoveryCode({
      userId: userRecord.id,
      code,
      expirationDate: `${Date.now() + (config.TOKENS.refresh.expiration * 1000)}`,
      created: seconds,
      updated: seconds,
    });
    await AccountRecoveryCode.save();

    // send an email
    const recoveryLink = `${config.FRONTEND_URL}/account-recovery/verify/${code}`;
    const { message, subject } = createAccountRecoveryTemplate(recoveryLink, userRecord.fullName);
    mailer(email, subject, message);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
