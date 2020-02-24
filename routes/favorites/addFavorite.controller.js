const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { getSeconds } = require('../../services/utilities');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Add post to the Favorites
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // check data
    const { params: { id = '' } = {} } = req;
    if (!id) {
      return basic(req, res, rs[400], 'MISSING_POST_ID');
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
      return basic(req, res, rs[404], 'POST_NOT_FOUND');
    }

    // create new Favorite record
    const seconds = getSeconds();
    const Favorite = new db.Favorite({
      postId: id,
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
