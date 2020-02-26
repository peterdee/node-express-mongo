const { basic, data, internalError } = require('../../services/responses');
const db = require('../../db');
const { getSeconds } = require('../../services/utilities');
const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');
const utils = require('../../services/utilities');

/**
 * Add comment to the post
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {post} /api/v1/comments Add comment to the post
 * @apiSampleRequest http://localhost:2211/api/v1/comments
 * @apiName AddComment
 * @apiGroup COMMENTS
 * @apiDescription This API allows user to add comment to the post
 *
 * @apiHeader {String} X-Access-Token Access token
 *
 * @apiHeaderExample {json} Request-Example:
 * {
 *   "X-Access-Token": "accessToken"
 * }
 *
 * @apiParam {Object} id Post ID
 *
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/comments [POST]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/comments [POST]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Object} data Data object, contains array of missing or invalid fields
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_DATA / INVALID_DATA
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/comments [POST]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_DATA
 * {
 *   "data": {
 *     "missing": [
 *       "postId",
 *       "text"
 *     ]
 *   },
 *   "datetime": 1570095138268,
 *   "info": "MISSING_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/comments [POST]",
 *   "status": 400
 * }
 *
 * @apiErrorExample {json} INVALID_DATA
 * {
 *   "data": {
 *     "invalid": [
 *       "postId",
 *       "text"
 *     ]
 *   },
 *   "datetime": 1570095578293,
 *   "info": "INVALID_DATA",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/comments [POST]",
 *   "status": 400
 * }
 *
 * @apiError (404) {Number} datetime Response timestamp
 * @apiError (404) {String} info POST_NOT_FOUND
 * @apiError (404) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (404) {String} request /api/v1/comments [POST]
 * @apiError (404) {Number} status 404
 *
 * @apiErrorExample {json} POST_NOT_FOUND
 * {
 *   "datetime": 1570095138268,
 *   "info": "POST_NOT_FOUND",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/comments [POST]",
 *   "status": 404
 * }
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const { body: { postId = '', text = '' } = {} } = req;
    const expected = [
      { field: 'postId', type: DATA_TYPES.string, value: postId },
      { field: 'text', type: DATA_TYPES.string, value: text },
    ];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      return data(req, res, rs[400], sm.missingData, { missing });
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      return data(req, res, rs[400], sm.invalidData, { invalid });
    }

    // check if post exists
    const post = await db.Post.findOne({
      _id: postId,
      isDeleted: false,
    });
    if (!post) {
      return basic(req, res, rs[404], sm.postNotFound);
    }

    // create new Comment record
    const seconds = getSeconds();
    const Comment = new db.Comment({
      authorId: req.id,
      postId: post.id,
      text,
      created: seconds,
      updated: seconds,
    });
    await Comment.save();

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
