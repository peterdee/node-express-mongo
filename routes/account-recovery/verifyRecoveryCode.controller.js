const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const db = require('../../db');
const utils = require('../../services/utilities');

const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Verify the account recovery code
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {post} /api/v1/account-recovery/verify-code Submit new account
 * @apiSampleRequest http://localhost:2211/api/v1/account-recovery/verify-code
 * @apiName VerifyCode
 * @apiGroup ACCOUNT-RECOVERY
 * @apiDescription This API allows user to verify the account recovery code and unblock the account
 *
 * @apiParam {Object} data Data object, should contain { code }
 *
 * @apiParamExample {json} data
 * {
 *   "code": "uniqueStringCode"
 * }
 *
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/account-recovery/verify-code [POST]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account-recovery/verify-code [POST]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Object} data Data object, contains array of missing or invalid fields
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_DATA / INVALID_DATA
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/account-recovery/verify-code [POST]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_DATA
 * {
 *   "data": {
 *     "missing": [
 *       "code"
 *     ]
 *   },
 *   "datetime": 1570095138268,
 *   "info": "MISSING_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account-recovery/verify-code [POST]",
 *   "status": 400
 * }
 *
 * @apiErrorExample {json} INVALID_DATA
 * {
 *   "data": {
 *     "invalid": [
 *       "code"
 *     ]
 *   },
 *   "datetime": 1570095578293,
 *   "info": "INVALID_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account-recovery/verify-code [POST]",
 *   "status": 400
 * }
 *
 * @apiError (401) {Number} datetime Response timestamp
 * @apiError (401) {String} info ACCESS_DENIED
 * @apiError (401) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (401) {String} request /api/v1/account-recovery/verify-code [POST]
 * @apiError (401) {Number} status 401
 *
 * @apiErrorExample {json} ACCESS_DENIED
 * {
 *   "datetime": 1570095578293,
 *   "info": "ACCESS_DENIED",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account-recovery/verify-code [POST]",
 *   "status": 401
 * }
 *
 * @apiError (403) {Number} datetime Response timestamp
 * @apiError (403) {String} info EXPIRED_RECOVERY_CODE / INVALID_RECOVERY_CODE
 * @apiError (403) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (403) {String} request /api/v1/account-recovery/verify-code [POST]
 * @apiError (403) {Number} status 403
 *
 * @apiErrorExample {json} EXPIRED_RECOVERY_CODE
 * {
 *   "datetime": 1570095578293,
 *   "info": "EXPIRED_RECOVERY_CODE",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account-recovery/verify-code [POST]",
 *   "status": 403
 * }
 *
 * @apiErrorExample {json} INVALID_RECOVERY_CODE
 * {
 *   "datetime": 1570095578293,
 *   "info": "INVALID_RECOVERY_CODE",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account-recovery/verify-code [POST]",
 *   "status": 403
 * }
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
      return basic(req, res, rs[403], sm.invalidRecoveryCode);
    }
    if (accountRecoveryRecord.expirationDate < utils.getSeconds()) {
      return basic(req, res, rs[403], sm.expiredRecoveryCode);
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

    // generate a new access image and mark records as deleted
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

    // store new access image, update user record
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
