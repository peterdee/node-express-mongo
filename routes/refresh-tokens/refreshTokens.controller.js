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
 *
 * apiDoc:
 * @api {post} /api/v1/refresh-tokens Refresh tokens
 * @apiSampleRequest http://localhost:2211/api/v1/refresh-tokens
 * @apiName RefreshTokens
 * @apiGroup REFRESH-TOKENS
 * @apiDescription This API allows user to refresh Access and Refresh tokens
 *
 * @apiParam {Object} data Data object, should contain { refreshToken }
 *
 * @apiParamExample {json} data
 * {
 *   "refreshToken": "refreshToken"
 * }
 *
 * @apiSuccess (200) {Object} data Data object, contains tokens and user role
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/refresh-tokens [POST]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "data": {
 *     "role": "user",
 *     "tokens": {
 *       "access": "ACCESS_TOKEN",
 *       "refresh": "REFRESH_TOKEN"
 *     }
 *   },
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/refresh-tokens [POST]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Object} data Data object, contains array of missing or invalid fields
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_DATA / INVALID_DATA
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/refresh-tokens [POST]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_DATA
 * {
 *   "data": {
 *     "missing": [
 *       "refreshToken"
 *     ]
 *   },
 *   "datetime": 1570095138268,
 *   "info": "MISSING_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/refresh-tokens [POST]",
 *   "status": 400
 * }
 *
 * @apiErrorExample {json} INVALID_DATA
 * {
 *   "data": {
 *     "invalid": [
 *       "refreshToken"
 *     ]
 *   },
 *   "datetime": 1570095578293,
 *   "info": "INVALID_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/refresh-tokens [POST]",
 *   "status": 400
 * }
 *
 * @apiError (401) {Number} datetime Response timestamp
 * @apiError (401) {String} info ACCESS_DENIED
 * @apiError (401) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (401) {String} request /api/v1/refresh-tokens [POST]
 * @apiError (401) {Number} status 401
 *
 * @apiErrorExample {json} ACCESS_DENIED
 * {
 *   "datetime": 1570095578293,
 *   "info": "ACCESS_DENIED",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/refresh-tokens [POST]",
 *   "status": 401
 * }
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
        _id: refreshTokenRecord.userId,
        isDeleted: false,
      }),
    ]);
    if (!(accessImageRecord && userRecord)) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // check expiration #1
    if (Date.now() > Number(refreshTokenRecord.expirationDate)) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // check expiration #2
    const decoded = await jwt.verify(refreshToken, config.TOKENS.refresh.secret);
    const { id = '', refreshImage = '' } = decoded || {};
    if (!(id && refreshImage)) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // User ID comparison
    if (id !== String(refreshTokenRecord.userId)) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // decoded refresh image comparison
    if (refreshImage !== refreshTokenRecord.refreshImage) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // generate a new refresh image, delete the used Refresh Token record
    const [newRefreshImage] = await Promise.all([
      utils.generateImage(userRecord.id),
      db.RefreshToken.deleteOne({ _id: refreshTokenRecord.id }),
    ]);
    const tokens = await utils.generateTokens(userRecord.id, accessImageRecord.image, newRefreshImage);

    // store new Refresh Token in the database
    const seconds = utils.getSeconds();
    const RefreshToken = new db.RefreshToken({
      userId: userRecord.id,
      refreshImage: newRefreshImage,
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
