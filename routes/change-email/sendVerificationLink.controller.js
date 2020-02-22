const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const { createEmailVerificationTemplate } = require('../../services/templates');
const db = require('../../db');
const mailer = require('../../services/mailer');
const utils = require('../../services/utilities');

const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Send verification link to the new email address
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {post} /api/v1/change-email/send-link Send verification link to the new email address
 * @apiSampleRequest http://localhost:2211/api/v1/change-email/send-link
 * @apiName ChangeEmailSendLink
 * @apiGroup CHANGE-EMAIL
 * @apiDescription This API allows user to receive a verification link on a new email address
 *
 * @apiHeader {String} X-Access-Token Access token
 *
 * @apiHeaderExample {json} Request-Example:
 * {
 *   "X-Access-Token": "accessToken"
 * }
 *
 * @apiParam {Object} data Data object, should contain { email }
 *
 * @apiParamExample {json} data
 * {
 *   "email": "userEmailAddress"
 * }
 *
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/change-email/send-link [POST]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/change-email/send-link [POST]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Object} data Data object, contains array of missing or invalid fields
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_DATA / INVALID_DATA
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/change-email/send-link [POST]
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
 *   "request": "/api/v1/change-email/send-link [POST]",
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
 *   "request": "/api/v1/change-email/send-link [POST]",
 *   "status": 400
 * }
 *
 * @apiError (403) {Number} datetime Response timestamp
 * @apiError (403) {String} info EMAIL_ALREADY_IN_USE
 * @apiError (403) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (403) {String} request /api/v1/change-email/send-link [POST]
 * @apiError (403) {Number} status 403
 *
 * @apiErrorExample {json} EMAIL_ALREADY_IN_USE
 * {
 *   "datetime": 1570095578293,
 *   "info": "EMAIL_ALREADY_IN_USE",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/change-email/send-link [POST]",
 *   "status": 403
 * }
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const { body: { email = '' } = {} } = req;
    const expected = [{ field: 'email', type: DATA_TYPES.string, value: email }];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      return data(req, res, rs[400], sm.missingData, { missing });
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      return data(req, res, rs[400], sm.invalidData, { invalid });
    }

    // make sure that the new email address is not in use
    const existing = await db.User.findOne({
      _id: {
        $ne: req.id,
      },
      email,
      isDeleted: false,
    });
    if (existing) {
      return basic(req, res, rs[403], sm.emailAlreadyInUse);
    }

    // find all of the existing UserEmail records
    const previousUserEmails = await db.UserEmail.find({
      userId: req.id,
      isDeleted: false,
    });

    // get Email Verification Code IDs
    const codeIds = previousUserEmails.map(({ emailVerificationCodeId }) => emailVerificationCodeId);

    // invalidate all of the related Email Verification Code records & all of the existing User Email records
    const seconds = utils.getSeconds();
    await Promise.all([
      db.EmailVerificationCode.updateMany(
        {
          _id: {
            $in: codeIds,
          },
        },
        {
          isDeleted: true,
          updated: seconds,
        },
      ),
      db.UserEmail.updateMany(
        {
          userId: req.id,
          isDeleted: false,
        },
        {
          isDeleted: true,
          updated: seconds,
        },
      ),
    ]);

    // create new Email Verification Code Record
    const code = utils.generateString(32);
    const EmailVerificationCode = new db.EmailVerificationCode({
      userId: req.id,
      code,
      expirationDate: `${Date.now() + (config.TOKENS.refresh.expiration * 1000)}`,
      created: seconds,
      updated: seconds,
    });

    // create new User Email Record
    const UserEmail = new db.UserEmail({
      userId: req.id,
      emailVerificationCodeId: EmailVerificationCode.id,
      newEmail: email,
      oldEmail: req.user.email,
      created: seconds,
      updated: seconds,
    });

    // store records
    await Promise.all([
      EmailVerificationCode.save(),
      UserEmail.save(),
    ]);

    // send an email
    const link = `${config.FRONTEND_URL}/change-email/${code}`;
    const { subject, template } = createEmailVerificationTemplate(link, req.user.fullName);
    mailer(email, subject, template);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
