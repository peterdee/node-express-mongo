const { basic, data, internalError } = require('../../services/responses');
const db = require('../../db');
const { formatPaginatedResponse } = require('../../services/utilities');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Get all comments for a post
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {get} /api/v1/comments/:id Get all comments for a post
 * @apiSampleRequest http://localhost:2211/api/v1/comments/:id
 * @apiName GetComments
 * @apiGroup COMMENTS
 * @apiDescription This API allows user to get all comments for a post
 *
 * @apiParam {String} id Post ID
 *
 * @apiSuccess (200) {Object} data Data object, contains post comments
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/comments/postid [GET]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/comments/postid [GET]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_POST_ID
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/comments/ [GET]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_POST_ID
 * {
 *   "datetime": 1570095138268,
 *   "info": "MISSING_POST_ID",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/comments/ [GET]",
 *   "status": 400
 * }
 */
module.exports = async (req, res) => {
  try {
    // check data
    const { pagination, params: { id = '' } = {} } = req;
    if (!id) {
      return basic(req, res, rs[400], sm.missingPostId);
    }

    // get all comments, count them as well
    const query = { postId: id };
    const [comments, count] = await Promise.all([
      db.Comment.find(
        query,
        null,
        {
          limit: pagination.limit,
          skip: pagination.offset,
          sort: '-_id',
        },
      ).populate({
        path: 'authorId',
        select: 'avatarLink firstName lastName',
      }),
      db.Comment.countDocuments(query),
    ]);

    // process the comments: determine if user is the author
    const withAuthor = comments.map((comment) => ({
      ...comment,
      isAuthor: comment.authorId && comment.authorId.id && comment.authorId.id === req.id,
    }));

    // format the response data
    const formattedData = formatPaginatedResponse(count, withAuthor, pagination);

    return data(req, res, rs[200], sm.ok, formattedData);
  } catch (error) {
    return internalError(req, res, error);
  }
};
