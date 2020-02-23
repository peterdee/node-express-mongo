const { data } = require('../../services/responses');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Get own account
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {void}
 *
 * apiDoc:
 * @api {get} /api/v1/account Get own account
 * @apiSampleRequest http://localhost:2211/api/v1/account
 * @apiName GetAccount
 * @apiGroup ACCOUNT
 * @apiDescription This API allows user to get his / her own account
 *
 * @apiHeader {String} X-Access-Token Access token
 *
 * @apiHeaderExample {json} Request-Example:
 * {
 *   "X-Access-Token": "accessToken"
 * }
 *
 * @apiSuccess (200) {Object} data Data object, contains user account data
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/account [GET]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "data": {
 *     "about": "about",
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
 *   "request": "/api/v1/account [GET]",
 *   "status": 200
 * }
 */
module.exports = (req, res) => data(req, res, rs[200], sm.ok, {
  about: req.user.about || '',
  avatarLink: req.user.avatarLink || '',
  created: req.user.created,
  email: req.user.email,
  emailIsVerified: req.user.emailIsVerified,
  firstName: req.user.firstName,
  lastName: req.user.lastName,
  role: req.role,
});
