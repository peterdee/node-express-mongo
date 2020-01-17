const jwt = require('jsonwebtoken');

const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const db = require('../../db');
const utils = require('../../services/utilities');

const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Refresh tokens
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const { refreshToken = '' } = req.body;
    const expected = [{ field: 'refreshToken', type: DATA_TYPES.string, value: refreshToken }];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      return data(req, res, rs[400], sm.missingData, { missing });
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      return data(req, res, rs[400], sm.invalidData, { invalid });
    }

    // find Refresh Token Record
    const refreshTokenRecord = await db.RefreshToken.findOne({
      token: refreshToken,
      isDeleted: false,
    });
    if (!refreshTokenRecord) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // get Access Image record and User Record
    const [accessImageRecord, userRecord] = await Promise.all([
      db.AccessImage.findOne({
        userId: refreshTokenRecord.userId,
        isDeleted: false,
      }),
      db.User.findOne({
        id: refreshTokenRecord.userId,
        isDeleted: false,
      }),
    ]);
    if (!(accessImageRecord && userRecord)) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // check expiration #1
    const seconds = utils.getSeconds();
    if (seconds > Number(refreshTokenRecord.expirationDate)) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // check expiration #2
    const decoded = await jwt.verify(refreshToken, config.TOKENS.refresh.secret);
    const { id = null, refreshImage = '' } = decoded || {};
    if (!(id && refreshImage)) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // User ID comparison
    if (id !== refreshTokenRecord.userId) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // decoded refresh image comparison
    if (refreshImage !== refreshTokenRecord.refreshImage) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // generate a new refresh image
    const newRefreshImage = await utils.generateImage(userRecord.id);
    const tokens = await utils.generateTokens(userRecord.id, accessImageRecord.image, newRefreshImage);

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
