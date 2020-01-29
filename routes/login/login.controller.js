const bcrypt = require('bcrypt');

const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const db = require('../../db');
const utils = require('../../services/utilities');

const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Login for a user
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const { email, password } = req.body;
    const expected = [
      { field: 'email', type: DATA_TYPES.string, value: email },
      { field: 'password', type: DATA_TYPES.string, value: password },
    ];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      return data(req, res, rs[400], sm.missingData, { missing });
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      return data(req, res, rs[400], sm.invalidData, { invalid });
    }

    // find the user by email
    const userRecord = await db.User.findOne({
      email,
      isDeleted: false,
    });
    if (!userRecord) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // additional check
    if (userRecord.accountStatus && userRecord.accountStatus === config.ACCOUNT_STATUSES.blocked) {
      return basic(req, res, rs[403], 'ACCOUNT_IS_BLOCKED');
    }

    // find access image and password records
    const seconds = utils.getSeconds();
    const query = {
      userId: userRecord.id,
      isDeleted: false,
    };
    const [accessImageRecord, passwordRecord] = await Promise.all([
      db.AccessImage.findOne(query),
      db.Password.findOne(query),
    ]);
    if (!passwordRecord) {
      // block the account
      await db.User.updateOne(
        {
          _id: userRecord.id,
        },
        {
          accountStatus: config.ACCOUNT_STATUSES.blocked,
          updated: seconds,
        },
      );
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // compare hashes
    const comparison = await bcrypt.compare(password, passwordRecord.hash);
    if (!comparison) {
      // brute force protection
      const failedLoginAttempts = userRecord.failedLoginAttempts < 5
        ? userRecord.failedLoginAttempts + 1
        : 5;
      const accountStatus = failedLoginAttempts < 5
        ? config.ACCOUNT_STATUSES.active
        : config.ACCOUNT_STATUSES.blocked;
      await db.User.updateOne(
        {
          _id: userRecord.id,
        },
        {
          accountStatus,
          failedLoginAttempts,
          updated: seconds,
        },
      );

      return basic(req, res, rs[401], sm.accessDenied);
    }

    // make sure that access image exists
    let { image: accessImage = '' } = accessImageRecord || {};
    if (!accessImage) {
      accessImage = await utils.generateImage(userRecord.id);

      // store access image in the database
      const NewAccessImage = new db.AccessImage({
        userId: userRecord.id,
        image: accessImage,
        created: seconds,
        updated: seconds,
      });
      await NewAccessImage.save();
    }

    // generate tokens
    const refreshImage = await utils.generateImage(userRecord.id);
    const tokens = await utils.generateTokens(userRecord.id, accessImage, refreshImage);

    // store refresh token in the database
    const RefreshToken = new db.RefreshToken({
      userId: userRecord.id,
      refreshImage,
      token: tokens.refresh,
      expirationDate: `${Date.now() + (config.TOKENS.refresh.expiration * 1000)}`,
      created: seconds,
      updated: seconds,
    });
    await RefreshToken.save();

    return data(req, res, rs[200], sm.ok, { role: userRecord.role, tokens });
  } catch (error) {
    return internalError(req, res, error);
  }
};
