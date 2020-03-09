const { basic, data, internalError } = require('../../services/responses');
const db = require('../../db');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Get a single post
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // check data
    const { params: { id = '' } = {} } = req;
    if (!id) {
      return basic(req, res, rs[400], sm.missingPostId);
    }

    // get post
    const post = await db.Post.findOne({
      _id: id,
      isDeleted: false,
    }).populate({
      path: 'authorId',
      select: 'avatarLink firstName lastName',
    });
    if (!post) {
      return basic(req, res, rs[404], sm.postNotFound);
    }

    // check if post was favorited
    const isFavorite = (req.id && await db.Favorite.findOne({
      isDeleted: false,
      postId: id,
      userId: req.id,
    })) || false;

    // get comments
    const comments = await db.Comment.find(
      {
        isDeleted: false,
        postId: id,
      },
      null,
      {
        limit: 25,
        sort: '-_id',
      },
    );

    return data(req, res, rs[200], sm.ok, { comments, isFavorite, post });
  } catch (error) {
    return internalError(req, res, error);
  }
};
