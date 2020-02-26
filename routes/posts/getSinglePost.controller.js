const { basic, data, internalError } = require('../../services/responses');
// const db = require('../../db');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Get a single post
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // check data
    const { params: { id = '' } = {} } = req;
    if (!id) {
      return basic(req, res, rs[400], sm.missingPostId);
    }

    return data(req, res, rs[200], sm.ok, null);
  } catch (error) {
    return internalError(req, res, error);
  }
};
