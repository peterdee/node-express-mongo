const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Delete the post
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
    const Post = await db.Post.findOne({
      _id: id,
      authorId: req.id,
      isDeleted: false,
    });
    if (!Post) {
      return basic(req, res, rs[404], sm.postNotFound);
    }

    // get Post Image UID from the image link
    const uid = Post.imageLink.split('/').slice(-1)[0];

    // delete Post and everything related to it
    const promises = [
      db.Comment.deleteMany({ postId: id }),
      db.Post.deleteOne({ _id: id }),
    ];
    if (uid) promises.push(db.Image.deleteOne({ uid }));
    await Promise.all(promises);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
