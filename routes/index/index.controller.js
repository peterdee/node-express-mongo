const { basic } = require('../../services/responses');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Index route
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {*}
 *
 * apiDoc:
 * @api {get} / Backend index
 * @apiSampleRequest http://localhost:2211/
 * @apiName Index
 * @apiGroup INDEX
 * @apiDescription This is a backend index route
 *
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request / [GET]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/ [GET]",
 *   "status": 200
 * }
 */
module.exports = (req, res) => basic(req, res, rs[200], sm.ok);
