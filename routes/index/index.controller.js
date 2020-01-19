const { basic } = require('../../services/responses');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Index route
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {*}
 */
module.exports = (req, res) => basic(req, res, rs[200], sm.ok);
