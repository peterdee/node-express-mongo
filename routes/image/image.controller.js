const { basic, internalError } = require('../../services/responses');
const db = require('../../db');
const { RESPONSE_STATUSES: rs } = require('../../config');

/**
 * Get the image
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 * 
 * apiDoc:
 * @api {get} /api/v1/image/:id Get the image
 * @apiSampleRequest http://localhost:2211/api/v1/image/:id
 * @apiName GetImage
 * @apiGroup IMAGE
 * @apiDescription This API allows the client application to load the images
 *
 * @apiParam {String} id Image ID
 * 
 * @apiError (400) {Number} datetime Response timestamp
 * @apiError (400) {String} info MISSING_IMAGE_ID
 * @apiError (400) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (400) {String} request /api/v1/image/ [GET]
 * @apiError (400) {Number} status 400
 *
 * @apiErrorExample {json} MISSING_IMAGE_ID
 * {
 *   "datetime": 1570095138268,
 *   "info": "MISSING_IMAGE_ID",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/image/ [GET]",
 *   "status": 400
 * }
 *
 * @apiError (404) {Number} datetime Response timestamp
 * @apiError (404) {String} info IMAGE_NOT_FOUND
 * @apiError (404) {String} misc NO_ADDITIONAL_INFORMATION
 * @apiError (404) {String} request /api/v1/image/doesnotexist [GET]
 * @apiError (404) {Number} status 404
 *
 * @apiErrorExample {json} IMAGE_NOT_FOUND
 * {
 *   "datetime": 1570095578293,
 *   "info": "IMAGE_NOT_FOUND",
 *   "misc": "NO_ADDITIONAL_INFORMATION",
 *   "request": "/api/v1/image/doesnotexist [GET]",
 *   "status": 404
 * }
 */
module.exports = async (req, res) => {
  try {
    // check the file id
    const { id = '' } = req.params;
    if (!id) {
      return basic(req, res, rs[400], 'MISSING_IMAGE_ID');
    }
    
    // load the Image record
    const image = await db.Image.findOne({
      uid: id,
      isDeleted: false,
    });
    if (!image) {
      return basic(req, res, rs[404], 'IMAGE_NOT_FOUND');
    }

    // convert the Base64 image back to binary
    const binary = Buffer.from(image.data, 'base64');

    // send the image back
    res.write(binary, 'binary');
    return res.end(null, 'binary');
  } catch (error) {
    return internalError(req, res, error);
  }
};
