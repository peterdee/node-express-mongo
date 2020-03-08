const jwt = require('jsonwebtoken');

const config = require('../config');
const db = require('../db');

/**
 * Soft authentication
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
      req.id = null;
      return next();
    }

    // get user ID and access image from the token
    const decoded = await jwt.verify(accessToken, config.TOKENS.access.secret);
    const { accessImage = '', id = null } = decoded || {};
    if (!(accessImage && id)) {
      req.id = null;
      return next();
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
      req.id = null;
      return next();
    }

    // compare Access Image
    const { image = '' } = accessImageRecord;
    if (!(image && image === accessImage)) {
      req.id = null;
      return next();
    }

    // continue
    req.id = userRecord.id;
    req.role = userRecord.role;
    req.user = userRecord;
    return next();
  } catch (err) {
    req.id = null;
    return next();
  }
};
