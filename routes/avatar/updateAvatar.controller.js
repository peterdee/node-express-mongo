const {
  APIS,
  BACKEND_URL,
  RESPONSE_STATUSES: rs,
  SERVER_MESSAGES: sm,
} = require('../../config');
const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const utils = require('../../services/utilities');

/**
 * Update avatar
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // check the file
    const { file: { buffer = '', mimetype = '' } = {} } = req;
    if (!(buffer && mimetype)) {
      return basic(req, res, rs[400], 'MISSING_FILE');
    }

    // prepare the file data
    const base64Encoded = Buffer.from(buffer, 'binary').toString('base64');

    // create the new Image record
    const seconds = utils.getSeconds();
    const uid = utils.generateString(24);
    const Image = new db.Image({
      data: base64Encoded,
      mimeType: mimetype,
      uid,
      created: seconds,
      updated: seconds,
    });

    // get the Image UID of the existing avatar
    const existingUID = req.user.avatarLink ? req.user.avatarLink.split('/').reverse()[0] : '';

    // save new Image record, delete previous Image record, update the User record
    await Promise.all([
      Image.save(),
      db.Image.deleteOne({ uid: existingUID }),
      db.User.updateOne(
        {
          _id: req.id,
        },
        {
          avatarLink: `${BACKEND_URL}/${APIS.prefix}/${APIS.version}/${APIS.paths.image}/${uid}`,
          updated: seconds,
        },
      ),
    ]);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
