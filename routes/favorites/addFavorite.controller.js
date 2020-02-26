const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { getSeconds } = require('../../services/utilities');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Add post to the Favorites
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {post} /api/v1/favorites/:id Add post to the Favorites
 * @apiSampleRequest http://localhost:2211/api/v1/favorites/:id
 * @apiName AddFavorite
 * @apiGroup FAVORITES
 * @apiDescription This API allows user to add post to the Favorites
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
 * @apiSuccess (200) {String} request /api/v1/favorites/somepostid [POST]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/favorites/somepostid [POST]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_POST_ID
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/favorites/ [POST]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_POST_ID
 * {
 *   "datetime": 1570095138268,
 *   "info": "MISSING_POST_ID",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/favorites/ [POST]",
 *   "status": 400
 * }
 *
 * @apiError (404) {Number} datetime Response timestamp
 * @apiError (404) {String} info POST_NOT_FOUND
 * @apiError (404) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (404) {String} request /api/v1/favorites/nonexistentid [POST]
 * @apiError (404) {Number} status 404
 *
 * @apiErrorExample {json} POST_NOT_FOUND
 * {
 *   "datetime": 1570095138268,
 *   "info": "POST_NOT_FOUND",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/favorites/nonexistentid [POST]",
 *   "status": 404
 * }
 */
module.exports = async (req, res) => {
  try {
    // check data
    const { params: { id = '' } = {} } = req;
    if (!id) {
      return basic(req, res, rs[400], sm.missingPostId);
    }

    // check if post was already favorited
    const favorited = await db.Favorite.findOne({
      isDeleted: false,
      postId: id,
      userId: req.id,
    });
    if (favorited) {
      return basic(req, res, rs[200], sm.ok);
    }

    // check if post exists
    const post = await db.Post.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!post) {
      return basic(req, res, rs[404], sm.postNotFound);
    }

    // create new Favorite record
    const seconds = getSeconds();
    const Favorite = new db.Favorite({
      postId: post.id,
      userId: req.id,
      created: seconds,
      updated: seconds,
    });
    await Favorite.save();

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
