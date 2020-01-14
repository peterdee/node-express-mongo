const bcrypt = require('bcrypt');

const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const db = require('../../db');
const utils = require('../../services/utilities');

const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Registration for a user
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const {
      email,
      firstName,
      lastName,
      password,
    } = req.body;
    const expected = [
      { field: 'email', type: DATA_TYPES.string, value: email },
      { field: 'firstName', type: DATA_TYPES.string, value: firstName },
      { field: 'lastName', type: DATA_TYPES.string, value: lastName },
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

    // make sure that email is not in use
    const existingRecord = await db.User.findOne({
      email,
      isDeleted: false,
    });
    if (existingRecord) {
      return basic(req, res, rs[400], sm.emailAlreadyInUse);
    }

    // create user record
    const seconds = utils.getSeconds();
    const User = new db.User({
      email,
      firstName,
      lastName,
      created: seconds,
      updated: seconds,
    });
    await User.save();

    // create access image, refresh image and password hash
    const [accessImage, refreshImage, hash] = await Promise.all([
      utils.generateImage(User.id),
      utils.generateImage(User.id),
      bcrypt.hash(password, 10),
    ]);

    // generate tokens
    const tokens = await utils.generateTokens(User.id, accessImage, refreshImage);

    // create access image record
    const AccessImage = new db.AccessImage({
      userId: User.id,
      image: accessImage,
      created: seconds,
      updated: seconds,
    });

    // create password record
    const Password = new db.Password({
      userId: User.id,
      hash,
      created: seconds,
      updated: seconds,
    });

    // create refresh token record
    const RefreshToken = new db.RefreshToken({
      userId: User.id,
      refreshImage,
      token: tokens.refresh,
      expirationDate: `${Date.now() + (config.TOKENS.refresh.expiration * 1000)}`,
      created: seconds,
      updated: seconds,
    });

    // store records
    await Promise.all([
      AccessImage.save(),
      Password.save(),
      RefreshToken.save(),
    ]);

    return data(req, res, rs[200], sm.ok, { tokens });
  } catch (error) {
    return internalError(req, res, error);
  }
};
