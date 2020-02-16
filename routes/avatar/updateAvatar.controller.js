const {
  APIS,
  BACKEND_URL,
  RESPONSE_STATUSES: rs,
  SERVER_MESSAGES: sm,
} = require('../../config');
const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const utils = require('../../services/utilities');

// allowed MIME types
const mimeTypes = ['image/jpeg', 'image/png'];

/**
 * Update avatar
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 * 
 * apiDoc:
 * @api {patch} /api/v1/avatar Update avatar
 * @apiSampleRequest http://localhost:2211/api/v1/avatar
 * @apiName UpdateAvatar
 * @apiGroup AVATAR
 * @apiDescription This API allows user to update his / her avatar
 *
 * @apiHeader {String} X-Access-Token Access token
 *
 * @apiHeaderExample {json} Request-Example:
 * {
 *   "X-Access-Token": "accessToken"
 * }
 * 
 * @apiParam {Object} data Data object (FormData) 
 * 
 * @apiSuccess (200) {Number} datetime Response timestamp
 * @apiSuccess (200) {String} info OK
 * @apiSuccess (200) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiSuccess (200) {String} request /api/v1/avatar [PATCH]
 * @apiSuccess (200) {Number} status 200
 *
 * @apiSuccessExample {json} OK
 * {
 *   "datetime": 1570104879307,
 *   "info": "OK",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/avatar [PATCH]",
 *   "status": 200
 * }
 * 
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_FILE / INVALID_FILE_SIZE / INVALID_FILE_TYPE
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/avatar [PATCH]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_FILE
 * {
 *   "datetime": 1570095138268,
 *   "info": "MISSING_FILE",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/avatar [PATCH]",
 *   "status": 400
 * }
 *
 * @apiErrorExample {json} INVALID_FILE_SIZE
 * {
 *   "datetime": 1570095578293,
 *   "info": "INVALID_FILE_SIZE",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/avatar [PATCH]",
 *   "status": 400
 * }
 * 
 * @apiErrorExample {json} INVALID_FILE_TYPE
 * {
 *   "datetime": 1570095578293,
 *   "info": "INVALID_FILE_TYPE",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/avatar [PATCH]",
 *   "status": 400
 * }
 */
module.exports = async (req, res) => {
  try {
    // check the file
    const { file: { buffer = '', mimetype = '', size = null } = {} } = req;
    if (!(buffer && mimetype && size)) {
      return basic(req, res, rs[400], 'MISSING_FILE');
    }
    if (size > 50000) {
      return basic(req, res, rs[400], 'INVALID_FILE_SIZE');
    }
    if (!mimeTypes.includes(mimetype)) {
      return basic(req, res, rs[400], 'INVALID_FILE_TYPE');
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
