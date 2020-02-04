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
 *
 * apiDoc:
 * @api {post} /api/v1/login Login for a user
 * @apiSampleRequest http://localhost:2211/api/v1/login
 * @apiName LoginUser
 * @apiGroup LOGIN
 * @apiDescription This API allows user to get Access and Refresh tokens
 *
 * @apiParam {Object} data Data object, should contain { email, password }
 *
 * @apiParamExample {json} data
 * {
 *   "email": "userEmail",
 *   "password": "userPassword"
 * }
 *
 * @apiSuccess (200) {Object} data Data object, contains tokens and user role
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/login [POST]
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
 *   "request": "/api/v1/login [POST]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Object} data Data object, contains array of missing or invalid fields
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_DATA / INVALID_DATA
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/login [POST]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_DATA
 * {
 *   "data": {
 *     "missing": [
 *       "email",
 *       "password"
 *     ]
 *   },
 *   "datetime": 1570095138268,
 *   "info": "MISSING_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/login [POST]",
 *   "status": 400
 * }
 *
 * @apiErrorExample {json} INVALID_DATA
 * {
 *   "data": {
 *     "invalid": [
 *       "email",
 *       "password"
 *     ]
 *   },
 *   "datetime": 1570095578293,
 *   "info": "INVALID_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/login [POST]",
 *   "status": 400
 * }
 *
 * @apiError (401) {Number} datetime Response timestamp
 * @apiError (401) {String} info ACCESS_DENIED
 * @apiError (401) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (401) {String} request /api/v1/login [POST]
 * @apiError (401) {Number} status 401
 *
 * @apiErrorExample {json} ACCESS_DENIED
 * {
 *   "datetime": 1570095578293,
 *   "info": "ACCESS_DENIED",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/login [POST]",
 *   "status": 401
 * }
 *
 * @apiError (403) {Number} datetime Response timestamp
 * @apiError (403) {String} info ACCOUNT_IS_BLOCKED
 * @apiError (403) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (403) {String} request /api/v1/login [POST]
 * @apiError (403) {Number} status 403
 *
 * @apiErrorExample {json} ACCOUNT_IS_BLOCKED
 * {
 *   "datetime": 1570095578293,
 *   "info": "ACCOUNT_IS_BLOCKED",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/login [POST]",
 *   "status": 403
 * }
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
      return basic(req, res, rs[403], sm.accountIsBlocked);
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
      const failedLoginAttempts = userRecord.failedLoginAttempts < config.MAXIMUM_FAILED_LOGIN_ATTEMPTS
        ? userRecord.failedLoginAttempts + 1
        : config.MAXIMUM_FAILED_LOGIN_ATTEMPTS;
      const accountStatus = failedLoginAttempts < config.MAXIMUM_FAILED_LOGIN_ATTEMPTS
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

    // store refresh token in the database, update user record if necessary
    const RefreshToken = new db.RefreshToken({
      userId: userRecord.id,
      refreshImage,
      token: tokens.refresh,
      expirationDate: `${Date.now() + (config.TOKENS.refresh.expiration * 1000)}`,
      created: seconds,
      updated: seconds,
    });
    const promises = [RefreshToken.save()];
    if (userRecord.failedLoginAttempts > 0) {
      promises.push(db.User.updateOne(
        {
          _id: userRecord.id,
        },
        {
          failedLoginAttempts: 0,
          updated: seconds,
        },
      ));
    }
    await Promise.all(promises);

    return data(req, res, rs[200], sm.ok, { role: userRecord.role, tokens });
  } catch (error) {
    return internalError(req, res, error);
  }
};
