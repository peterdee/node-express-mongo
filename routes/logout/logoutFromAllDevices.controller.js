const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');
const utils = require('../../services/utilities');

/**
 * Logout from all devices
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 * 
 * apiDoc:
 * @api {get} /api/v1/logout/all Logout from all devices
 * @apiSampleRequest http://localhost:2211/api/v1/logout/all
 * @apiName LogoutAll
 * @apiGroup LOGOUT
 * @apiDescription This API allows user to log out from all devices
 *
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/logout/all [GET]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/logout/all [GET]",
 *   "status": 200
 * }
 */
module.exports = async (req, res) => {
  try {
    // create a new access image, update access image record and refresh token records
    const query = { isDeleted: false, userId: req.id };
    const seconds = utils.getSeconds();
    const update = { isDeleted: true, updated: seconds };
    const [accessImage] = await Promise.all([
      utils.generateImage(req.id),
      db.AccessImage.updateMany(query, update),
      db.RefreshToken.updateMany(query, update),
    ]);

    // create new Access Image Record
    const AccessImage = new db.AccessImage({
      userId: req.id,
      image: accessImage,
      created: seconds,
      updated: seconds,
    });
    await AccessImage.save();

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
