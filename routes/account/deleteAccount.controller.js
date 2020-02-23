const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { getSeconds } = require('../../services/utilities');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Delete own account
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {delete} /api/v1/account Delete own account
 * @apiSampleRequest http://localhost:2211/api/v1/account
 * @apiName DeleteAccount
 * @apiGroup ACCOUNT
 * @apiDescription This API allows user to delete his / her own account
 *
 * @apiHeader {String} X-Access-Token Access token
 *
 * @apiHeaderExample {json} Request-Example:
 * {
 *   "X-Access-Token": "accessToken"
 * }
 *
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/account [DELETE]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/account [DELETE]",
 *   "status": 200
 * }
 */
module.exports = async (req, res) => {
  try {
    // mark Password and User records as deleted
    const seconds = getSeconds();
    await Promise.all([
      db.Password.updateOne(
        {
          userId: req.id,
        },
        {
          isDeleted: true,
          updated: seconds,
        },
      ),
      db.User.updateOne(
        {
          _id: req.id,
        },
        {
          isDeleted: true,
          updated: seconds,
        },
      ),
    ]);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
