const { basic, data, internalError } = require('../../services/responses');
const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');
const db = require('../../db');
const utils = require('../../services/utilities');

/**
 * Update avatar
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
