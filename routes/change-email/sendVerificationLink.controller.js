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
    // const previousUserEmails = await db.UserEmail.find({
    //   userId: req.id,
    //   isDeleted: false,
    // });

    // get Email Verification Code IDs
    // const emailVerificationCodeIDs = previousUserEmails.map(({
    //   emailVerificationCodeId,
    // }) => emailVerificationCodeId);

    // invalidate all of the existing User Email records and all of the related Email Verification Code records
    // await Promise.all([
    //   db.EmailVerificationCode.updateMany(
    //     {
    //       _id: {
    //         $in: emailVerificationCodeIDs,
    //       },
    //     },
    //     {
    //
    //     }
    //   )
    // ]);

    // create new Email Verification Code Record
    const code = utils.generateString(32);
    const seconds = utils.getSeconds();
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
