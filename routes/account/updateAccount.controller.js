const { basic, data, internalError } = require('../../services/responses');
const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');
const db = require('../../db');
const utils = require('../../services/utilities');

/**
 * Update own account
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 * 
 * apiDoc:
 * @api {patch} /api/v1/account Update own account
 * @apiSampleRequest http://localhost:2211/api/v1/account
 * @apiName UpdateAccount
 * @apiGroup ACCOUNT
 * @apiDescription This API allows user to update his / her own account
 *
 * @apiHeader {String} X-Access-Token Access token
 *
 * @apiHeaderExample {json} Request-Example:
 * {
 *   "X-Access-Token": "accessToken"
 * }
 * 
 * @apiParam {Object} data Data object, should contain { firstName, lastName }
 *
 * @apiParamExample {json} data
 * {
 *   "firstName": "firstName",
 *   "lastName": "lastName"
 * }
 * 
 * @apiSuccess (200) {Object} data Data object, contains user account data
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/account [PATCH]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "data": {
 *     "avatarLink": "avatarLink",
 *     "created": "created",
 *     "email": "email",
 *     "emailIsVerified": "emailIsVerified",
 *     "firstName": "firstName",
 *     "lastName": "lastName",
 *     "role": "role",
 *   },
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account [PATCH]",
 *   "status": 200
 * }
 * 
 * @apiError (400) {Object} data Data object, contains array of missing or invalid fields
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_DATA / INVALID_DATA
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/account [PATCH]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_DATA
 * {
 *   "data": {
 *     "missing": [
 *       "firstName",
 *       "lastName"
 *     ]
 *   },
 *   "datetime": 1570095138268,
 *   "info": "MISSING_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account [PATCH]",
 *   "status": 400
 * }
 *
 * @apiErrorExample {json} INVALID_DATA
 * {
 *   "data": {
 *     "invalid": [
 *       "firstName",
 *       "lastName"
 *     ]
 *   },
 *   "datetime": 1570095578293,
 *   "info": "INVALID_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account [PATCH]",
 *   "status": 400
 * }
 * 
 * @apiError (403) {Number} datetime Response timestamp
 * @apiError (403) {String} info FAILED_TO_LOAD_ACCOUNT
 * @apiError (403) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (403) {String} request /api/v1/account [PATCH]
 * @apiError (403) {Number} status 403
 *
 * @apiErrorExample {json} FAILED_TO_LOAD_ACCOUNT
 * {
 *   "datetime": 1570095578293,
 *   "info": "FAILED_TO_LOAD_ACCOUNT",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account [PATCH]",
 *   "status": 403
 * }
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const { firstName, lastName } = req.body;
    const expected = [
      { field: 'firstName', type: DATA_TYPES.string, value: firstName },
      { field: 'lastName', type: DATA_TYPES.string, value: lastName },
    ];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      return data(req, res, rs[400], sm.missingData, { missing });
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      return data(req, res, rs[400], sm.invalidData, { invalid });
    }

    // update User record
    await db.User.updateOne(
      {
        _id: req.id,
      },
      {
        firstName,
        lastName,
        updated: utils.getSeconds(),
      },
    );

    // load updated User record
    const User = await db.User.findOne({
      _id: req.id,
      isDeleted: false,
    });
    if (!User) {
      return basic(req, res, rs[403], 'FAILED_TO_LOAD_ACCOUNT');
    }

    return data(req, res, rs[200], sm.ok, {
      avatarLink: User.avatarLink || '',
      created: User.created,
      email: User.email,
      emailIsVerified: User.emailIsVerified,
      firstName: User.firstName,
      lastName: User.lastName,
      role: User.role,
    });
  } catch (error) {
    return internalError(req, res, error);
  }
};
