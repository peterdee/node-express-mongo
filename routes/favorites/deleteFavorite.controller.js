const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { getSeconds } = require('../../services/utilities');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Delete post from the Favorites
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
