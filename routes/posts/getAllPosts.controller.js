const { data, internalError } = require('../../services/responses');
const db = require('../../db');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Get all posts
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    const Posts = await db.Post.find({ isDeleted: false });
    return data(req, res, rs[200], sm.ok, { posts: Posts });
  } catch (error) {
    return internalError(req, res, error);
  }
};
