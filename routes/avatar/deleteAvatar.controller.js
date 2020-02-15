const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { getSeconds } = require('../../services/utilities');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');

/**
 * Delete avatar
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // return if there's nothing to delete
    if (!req.user.avatarLink) {
      return basic(req, res, rs[200], sm.ok);
    }

    // update the User record
    await db.User.updateOne(
      {
        _id: req.id,
      },
      {
        avatarLink: '',
        updated: getSeconds(),
      },
    );

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
