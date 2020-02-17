const jwt = require('jsonwebtoken');

const config = require('../config');
const db = require('../db');
const { basic } = require('../services/responses');

const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Authenticate user
 * @param req {object} - request object
 * @param res {object} - response object
 * @param next {*} - continue to the next controller or middleware
 * @return {Promise<*>}
 */
module.exports = async (req, res, next) => {
  try {
    // check if access token is provided
    const { 'x-access-token': accessToken = '' } = req.headers || {};
    if (!accessToken) {
      return basic(req, res, rs[401], sm.missingToken);
    }

    // get user ID and access image from the token
    const decoded = await jwt.verify(accessToken, config.TOKENS.access.secret);
    const { accessImage = '', id = null } = decoded || {};
    if (!(accessImage && id)) {
      return basic(req, res, rs[401], sm.invalidToken);
    }

    // check data in the database
    const [accessImageRecord, userRecord] = await Promise.all([
      db.AccessImage.findOne({
        userId: id,
        isDeleted: false,
      }),
      db.User.findOne({
        _id: id,
        accountStatus: config.ACCOUNT_STATUSES.active,
        isDeleted: false,
      }),
    ]);
    if (!(accessImageRecord && userRecord)) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // compare Access Image
    const { image = '' } = accessImageRecord;
    if (!(image && image === accessImage)) {
      return basic(req, res, rs[401], sm.invalidToken);
    }

    // continue
    req.id = userRecord.id;
    req.role = userRecord.role;
    req.user = userRecord;
    return next();
  } catch (err) {
    // check for expiration error
    if (err.name && err.name === 'TokenExpiredError') {
      return basic(req, res, rs[401], sm.tokenExpired);
    }

    return basic(req, res, rs[401], sm.invalidToken);
  }
};
