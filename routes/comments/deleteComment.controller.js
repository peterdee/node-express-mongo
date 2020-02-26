const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Delete post comment
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 *
 * apiDoc:
 * @api {delete} /api/v1/comments/:id Delete post comment
 * @apiSampleRequest http://localhost:2211/api/v1/comments/:id
 * @apiName DeleteComment
 * @apiGroup COMMENTS
 * @apiDescription This API allows user to delete post comment
 *
 * @apiHeader {String} X-Access-Token Access token
 *
 * @apiHeaderExample {json} Request-Example:
 * {
 *   "X-Access-Token": "accessToken"
 * }
 *
 * @apiParam {String} id Comment ID
 *
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/comments/commentid [DELETE]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/comments/commentid [DELETE]",
 *   "status": 200
 * }
 *
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_COMMENT_ID
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/comments/ [DELETE]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_COMMENT_ID
 * {
 *   "datetime": 1570095138268,
 *   "info": "MISSING_COMMENT_ID",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/comments/ [DELETE]",
 *   "status": 400
 * }
 */
module.exports = async (req, res) => {
  try {
    // check data
    const { params: { id = '' } = {} } = req;
    if (!id) {
      return basic(req, res, rs[400], sm.missingCommentId);
    }

    // delete the Comment record (no additional checks)
    await db.Comment.deleteOne({
      _id: id,
      userId: req.id,
    });

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
