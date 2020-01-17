const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../../config');
const utils = require('../../services/utilities');

/**
 * Send recovery email
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // create a new access image, update access image record and refresh token records
    const query = { isDeleted: false, userId: req.id };
    const seconds = utils.getSeconds();
    const update = { isDeleted: true, updated: seconds };
    const [accessImage] = await Promise.all([
      utils.generateImage(req.id),
      db.AccessImage.updateMany(query, update),
      db.RefreshToken.updateMany(query, update),
    ]);

    // create new Access Image Record
    const AccessImage = new db.AccessImage({
      userId: req.id,
      image: accessImage,
      created: seconds,
      updated: seconds,
    });
    await AccessImage.save();

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
