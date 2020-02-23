const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const { createAccountRecoveryTemplate } = require('../../services/templates');
const db = require('../../db');
const mailer = require('../../services/mailer');
const utils = require('../../services/utilities');

const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Send account recovery email
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {post} /api/v1/account-recovery/send-email Send account recovery email
 * @apiSampleRequest http://localhost:2211/api/v1/account-recovery/send-email
 * @apiName SendEmail
 * @apiGroup ACCOUNT-RECOVERY
 * @apiDescription This API allows user to receive an email that contains the account recovery link
 *
 * @apiParam {Object} data Data object, should contain { email }
 *
 * @apiParamExample {json} data
 * {
 *   "email": "userEmail"
 * }
 *
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/account-recovery/send-email [POST]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account-recovery/send-email [POST]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Object} data Data object, contains array of missing or invalid fields
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_DATA / INVALID_DATA
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/account-recovery/send-email [POST]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_DATA
 * {
 *   "data": {
 *     "missing": [
 *       "email"
 *     ]
 *   },
 *   "datetime": 1570095138268,
 *   "info": "MISSING_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account-recovery/send-email [POST]",
 *   "status": 400
 * }
 *
 * @apiErrorExample {json} INVALID_DATA
 * {
 *   "data": {
 *     "invalid": [
 *       "email"
 *     ]
 *   },
 *   "datetime": 1570095578293,
 *   "info": "INVALID_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account-recovery/send-email [POST]",
 *   "status": 400
 * }
 *
 * @apiError (401) {Number} datetime Response timestamp
 * @apiError (401) {String} info ACCESS_DENIED
 * @apiError (401) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (401) {String} request /api/v1/account-recovery/send-email [POST]
 * @apiError (401) {Number} status 401
 *
 * @apiErrorExample {json} ACCESS_DENIED
 * {
 *   "datetime": 1570095578293,
 *   "info": "ACCESS_DENIED",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account-recovery/send-email [POST]",
 *   "status": 401
 * }
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const { email } = req.body;
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

    // create a new Account Recovery Code record
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
    const recoveryLink = `${config.FRONTEND_URL}/account-recovery/${code}`;
    const { subject, template } = createAccountRecoveryTemplate(recoveryLink, userRecord.fullName);
    mailer(email, subject, template);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
