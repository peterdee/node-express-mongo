const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Delete post from the Favorites
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {delete} /api/v1/favorites/:id Delete post from the Favorites
 * @apiSampleRequest http://localhost:2211/api/v1/favorites/:id
 * @apiName DeleteFavorite
 * @apiGroup FAVORITES
 * @apiDescription This API allows user to delete a post from the Favorites
 *
 * @apiHeader {String} X-Access-Token Access token
 *
 * @apiHeaderExample {json} Request-Example:
 * {
 *   "X-Access-Token": "accessToken"
 * }
 *
 * @apiParam {String} id Post ID
 *
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/favorites/somepostid [DELETE]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/favorites/somepostid [DELETE]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_POST_ID
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/favorites/ [DELETE]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_POST_ID
 * {
 *   "datetime": 1570095138268,
 *   "info": "MISSING_POST_ID",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/favorites/ [DELETE]",
 *   "status": 400
 * }
 */
module.exports = async (req, res) => {
  try {
    // check data
    const { params: { id = '' } = {} } = req;
    if (!id) {
      return basic(req, res, rs[400], sm.missingPostId);
    }

    // delete the Favorite record (no additional checks)
    await db.Favorite.deleteOne({
      postId: id,
      userId: req.id,
    });

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
