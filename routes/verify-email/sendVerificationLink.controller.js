const { basic, internalError } = require('../../services/responses');
const config = require('../../config');
const { createEmailVerificationTemplate } = require('../../services/templates');
const db = require('../../db');
const { generateString, getSeconds } = require('../../services/utilities');
const mailer = require('../../services/mailer');

const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Send an email verification link
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {get} /api/v1/verify-email Send an email verification link
 * @apiSampleRequest http://localhost:2211/api/v1/verify-email
 * @apiName VerifyEmailSendLink
 * @apiGroup VERIFY-EMAIL
 * @apiDescription This API allows user to send an email verification link after the registration
 *
 * @apiHeader {String} X-Access-Token Access token
 *
 * @apiHeaderExample {json} Request-Example:
 * {
 *   "X-Access-Token": "accessToken"
 * }
 *
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/verify-email [GET]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/verify-email [GET]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info EMAIL_ALREADY_VERIFIED
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/verify-email [GET]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} EMAIL_ALREADY_VERIFIED
 * {
 *   "datetime": 1570095578293,
 *   "info": "EMAIL_ALREADY_VERIFIED",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/verify-email [GET]",
 *   "status": 400
 * }
 */
module.exports = async (req, res) => {
  try {
    // make sure that user's email is not verified
    if (req.user.emailIsVerified) {
      return basic(req, res, rs[400], sm.emailAlreadyVerified);
    }

    // invalidate all of the previously sent codes
    const seconds = getSeconds();
    await db.EmailVerificationCode.updateMany(
      {
        isDeleted: false,
        userId: req.id,
      },
      {
        isDeleted: true,
        updated: seconds,
      },
    );

    // create a new Email Verification Code record
    const code = generateString(32);
    const EmailVerificationCode = new db.EmailVerificationCode({
      userId: req.id,
      code,
      expirationDate: `${Date.now() + (config.TOKENS.refresh.expiration * 1000)}`,
      created: seconds,
      updated: seconds,
    });
    await EmailVerificationCode.save();

    // send an email
    const link = `${config.FRONTEND_URL}/verify-email/${code}`;
    const { subject, template } = createEmailVerificationTemplate(link, req.user.fullName);
    mailer(req.user.email, subject, template);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
