const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { getSeconds } = require('../../services/utilities');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Delete avatar
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 * 
 * apiDoc:
 * @api {delete} /api/v1/avatar Delete avatar
 * @apiSampleRequest http://localhost:2211/api/v1/avatar
 * @apiName DeleteAvatar
 * @apiGroup AVATAR
 * @apiDescription This API allows user to delete his / her avatar
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
 * @apiSuccess (200) {String} request /api/v1/avatar [DELETE]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/avatar [DELETE]",
 *   "status": 200
 * }
 */
module.exports = async (req, res) => {
  try {
    // return if there's nothing to delete
    if (!req.user.avatarLink) {
      return basic(req, res, rs[200], sm.ok);
    }

    // get Image UID from the avatar link
    const uid = req.user.avatarLink.split('/').reverse()[0];

    // delete the Image record and update the User record
    await Promise.all([
      db.Image.deleteOne({ uid }),
      db.User.updateOne(
        {
          _id: req.id,
        },
        {
          avatarLink: '',
          updated: getSeconds(),
        },
      ),
    ]);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
