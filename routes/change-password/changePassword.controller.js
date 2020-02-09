const bcrypt = require('bcrypt');

const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const db = require('../../db');
const utils = require('../../services/utilities');

const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Change user's password
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 * 
 * apiDoc:
 * @api {patch} /api/v1/change-password Change user's password
 * @apiSampleRequest http://localhost:2211/api/v1/change-password
 * @apiName ChangePassword
 * @apiGroup CHANGE-PASSWORD
 * @apiDescription This API allows user to update his / her password
 *
 * @apiHeader {String} X-Access-Token Access token
 *
 * @apiHeaderExample {json} Request-Example:
 * {
 *   "X-Access-Token": "accessToken"
 * }
 * 
 * @apiParam {Object} data Data object, should contain { newPassword, oldPassword }
 *
 * @apiParamExample {json} data
 * {
 *   "newPassword": "newPasswordString",
 *   "oldPassword": "oldPasswordString"
 * }
 * 
 * @apiSuccess (200) {Object} data Data object, contains tokens
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/change-password [PATCH]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "data": {
 *     "tokens": {
 *       "access": "ACCESS_TOKEN",
 *       "refresh": "REFRESH_TOKEN"
 *     }
 *   },
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/change-password [PATCH]",
 *   "status": 200
 * }
 * 
 * @apiError (400) {Object} data Data object, contains array of missing or invalid fields
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_DATA / INVALID_DATA
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/change-password [PATCH]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_DATA
 * {
 *   "data": {
 *     "missing": [
 *       "newPassword",
 *       "oldPassword"
 *     ]
 *   },
 *   "datetime": 1570095138268,
 *   "info": "MISSING_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/change-password [PATCH]",
 *   "status": 400
 * }
 *
 * @apiErrorExample {json} INVALID_DATA
 * {
 *   "data": {
 *     "invalid": [
 *       "newPassword",
 *       "oldPassword"
 *     ]
 *   },
 *   "datetime": 1570095578293,
 *   "info": "INVALID_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/change-password [PATCH]",
 *   "status": 400
 * }
 * 
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info OLD_PASSWORD_IS_INVALID
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/change-password [PATCH]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} OLD_PASSWORD_IS_INVALID
 * {
 *   "datetime": 1570095138268,
 *   "info": "OLD_PASSWORD_IS_INVALID",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/change-password [PATCH]",
 *   "status": 400
 * }
 * 
 * @apiError (401) {Number} datetime Response timestamp
 * @apiError (401) {String} info ACCESS_DENIED
 * @apiError (401) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (401) {String} request /api/v1/change-password [PATCH]
 * @apiError (401) {Number} status 401
 *
 * @apiErrorExample {json} ACCESS_DENIED
 * {
 *   "datetime": 1570095578293,
 *   "info": "ACCESS_DENIED",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/change-password [PATCH]",
 *   "status": 401
 * }
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const { newPassword = '', oldPassword = '' } = req.body;
    const expected = [
      { field: 'newPassword', type: DATA_TYPES.string, value: newPassword },
      { field: 'oldPassword', type: DATA_TYPES.string, value: oldPassword },
    ];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      return data(req, res, rs[400], sm.missingData, { missing });
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      return data(req, res, rs[400], sm.invalidData, { invalid });
    }

    // find password record
    const passwordRecord = await db.Password.findOne({
      userId: req.id,
      isDeleted: false,
    });
    if (!passwordRecord) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // compare hashes
    const comparison = await bcrypt.compare(oldPassword, passwordRecord.hash);
    if (!comparison) {
      return basic(req, res, rs[400], 'OLD_PASSWORD_IS_INVALID');
    }

    // create new images and password hash, mark all of the refresh tokens as deleted
    const seconds = utils.getSeconds();
    const query = {
      userId: req.id,
      isDeleted: false,
    };
    const [accessImage, refreshImage, hash] = await Promise.all([
      utils.generateImage(req.id),
      utils.generateImage(req.id),
      bcrypt.hash(newPassword, 10),
      db.RefreshToken.updateMany(query, {
        isDeleted: true,
        updated: seconds,
      }),
    ]);

    // generate new set of tokens
    const tokens = await utils.generateTokens(req.id, accessImage, refreshImage);

    // create new Refresh Token
    const RefreshToken = new db.RefreshToken({
      userId: req.id,
      refreshImage,
      token: tokens.refresh,
      expirationDate: `${Date.now() + (config.TOKENS.refresh.expiration * 1000)}`,
      created: seconds,
      updated: seconds,
    });

    // save updates
    await Promise.all([
      db.AccessImage.updateMany(query, {
        image: accessImage,
        updated: seconds,
      }),
      db.Password.updateOne(
        {
          id: passwordRecord.id,
        },
        {
          hash,
          updated: seconds,
        },
      ),
      RefreshToken.save(),
      db.User.updateOne(
        {
          _id: req.id,
        },
        {
          failedLoginAttempts: 0,
          updated: seconds,
        },
      ),
    ]);

    return data(req, res, rs[200], sm.ok, { tokens });
  } catch (error) {
    return internalError(req, res, error);
  }
};
