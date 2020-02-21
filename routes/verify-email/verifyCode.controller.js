const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const db = require('../../db');
const utils = require('../../services/utilities');

const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Verify the email verification code
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {post} /api/v1/verify-email Verify the email verification code
 * @apiSampleRequest http://localhost:2211/api/v1/verify-email
 * @apiName VerifyEmailVerifyCode
 * @apiGroup VERIFY-EMAIL
 * @apiDescription This API allows user to verify the email verification code
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
 * @apiSuccess (200) {String} request /api/v1/verify-email [POST]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/verify-email [POST]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Object} data Data object, contains array of missing or invalid fields
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_DATA / INVALID_DATA
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/verify-email [POST]
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
 *   "request": "/api/v1/verify-email [POST]",
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
 *   "request": "/api/v1/verify-email [POST]",
 *   "status": 400
 * }
 *
 * @apiError (401) {Number} datetime Response timestamp
 * @apiError (401) {String} info ACCESS_DENIED
 * @apiError (401) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (401) {String} request /api/v1/verify-email [POST]
 * @apiError (401) {Number} status 401
 *
 * @apiErrorExample {json} ACCESS_DENIED
 * {
 *   "datetime": 1570095578293,
 *   "info": "ACCESS_DENIED",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/verify-email [POST]",
 *   "status": 401
 * }
 *
 * @apiError (403) {Number} datetime Response timestamp
 * @apiError (403) {String} info EMAIL_ALREADY_VERIFIED / EXPIRED_VERIFICATION_CODE / INVALID_VERIFICATION_CODE
 * @apiError (403) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (403) {String} request /api/v1/verify-email [POST]
 * @apiError (403) {Number} status 403
 *
 * @apiErrorExample {json} EMAIL_ALREADY_VERIFIED
 * {
 *   "datetime": 1570095578293,
 *   "info": "EMAIL_ALREADY_VERIFIED",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/verify-email [POST]",
 *   "status": 403
 * }
 *
 * @apiErrorExample {json} EXPIRED_VERIFICATION_CODE
 * {
 *   "datetime": 1570095578293,
 *   "info": "EXPIRED_VERIFICATION_CODE",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/verify-email [POST]",
 *   "status": 403
 * }
 *
 * @apiErrorExample {json} INVALID_VERIFICATION_CODE
 * {
 *   "datetime": 1570095578293,
 *   "info": "INVALID_VERIFICATION_CODE",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/verify-email [POST]",
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

    // find the Email Verification Code Record
    const emailVerificationCodeRecord = await db.EmailVerificationCode.findOne({
      code,
      isDeleted: false,
    });
    if (!emailVerificationCodeRecord) {
      return basic(req, res, rs[403], sm.invalidVerificationCode);
    }
    if (emailVerificationCodeRecord.expirationDate < utils.getSeconds()) {
      return basic(req, res, rs[403], sm.expiredVerificationCode);
    }

    // load User Record
    const userRecord = await db.User.findOne({
      _id: emailVerificationCodeRecord.userId,
      isDeleted: false,
    });
    if (!userRecord) {
      return basic(req, res, rs[401], sm.accessDenied);
    }
    if (userRecord.emailIsVerified) {
      return basic(req, res, rs[403], sm.emailAlreadyVerified);
    }

    // update records
    const seconds = utils.getSeconds();
    await Promise.all([
      db.EmailVerificationCode.updateMany(
        {
          _id: emailVerificationCodeRecord.id,
        },
        {
          isDeleted: true,
          updated: seconds,
        },
      ),
      db.User.updateOne(
        {
          _id: userRecord.id,
        },
        {
          emailIsVerified: true,
          updated: seconds,
        },
      ),
    ]);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
