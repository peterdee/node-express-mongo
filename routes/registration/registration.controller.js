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
 *
 * apiDoc:
 * @api {post} /api/v1/registration Registration for a user
 * @apiSampleRequest http://localhost:2211/api/v1/registration
 * @apiName Registration
 * @apiGroup REGISTRATION
 * @apiDescription This API allows user to create a new account and to get Access and Refresh tokens
 *
 * @apiParam {Object} data Data object, should contain { email, firstName, lastName, password }
 *
 * @apiParamExample {json} data
 * {
 *   "email": "userEmail",
 *   "firstName": "Test",
 *   "lastName": "User",
 *   "password": "userPassword"
 * }
 *
 * @apiSuccess (200) {Object} data Data object, contains tokens and user role
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/registration [POST]
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
 *   "request": "/api/v1/registration [POST]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Object} data Data object, contains array of missing or invalid fields
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_DATA / INVALID_DATA
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/registration [POST]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_DATA
 * {
 *   "data": {
 *     "missing": [
 *       "email",
 *       "firstName",
 *       "lastName",
 *       "password"
 *     ]
 *   },
 *   "datetime": 1570095138268,
 *   "info": "MISSING_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/registration [POST]",
 *   "status": 400
 * }
 *
 * @apiErrorExample {json} INVALID_DATA
 * {
 *   "data": {
 *     "invalid": [
 *       "email",
 *       "firstName",
 *       "lastName",
 *       "password"
 *     ]
 *   },
 *   "datetime": 1570095578293,
 *   "info": "INVALID_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/registration [POST]",
 *   "status": 400
 * }
 *
 * @apiError (403) {Number} datetime Response timestamp
 * @apiError (403) {String} info EMAIL_ALREADY_IN_USE
 * @apiError (403) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (403) {String} request /api/v1/registration [POST]
 * @apiError (403) {Number} status 403
 *
 * @apiErrorExample {json} EMAIL_ALREADY_IN_USE
 * {
 *   "datetime": 1570095138268,
 *   "info": "EMAIL_ALREADY_IN_USE",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/registration [POST]",
 *   "status": 403
 * }
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
      return basic(req, res, rs[403], sm.emailAlreadyInUse);
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

    return data(req, res, rs[200], sm.ok, { role: User.role, tokens });
  } catch (error) {
    return internalError(req, res, error);
  }
};
