const AWS = require('aws-sdk');

const { basic, internalError } = require('./responses');
const { CELLAR, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = require('../config');

const { BUCKET: Bucket } = CELLAR;

// set up the Cellar service
AWS.config.update({
  accessKeyId: CELLAR.KEY_ID,
  secretAccessKey: CELLAR.KEY_SECRET,
});
const S3 = new AWS.S3({ endpoint: new AWS.Endpoint(CELLAR.HOST) });

// available methods
module.exports = {
  /**
   * Download the file from Cellar storage
   * @param req {object} - request object
   * @param res {object} - response object
   * @param Key {string} - file name
   * @returns {Promise<void>}
   */
  downloadFile: async (req, res, Key = '') => {
    try {
      // check the file in the bucket
      const headError = await new Promise(
        (resolve) => S3.headObject({ Bucket, Key }, (error = null) => resolve(error)),
      );
      if (headError) {
        return basic(req, res, rs[404], 'FILE_NOT_FOUND');
      }

      // create the data stream
      const stream = S3.getObject({ Bucket, Key }).createReadStream();

      // pipe the data back to the client
      return stream.pipe(res);
    } catch (error) {
      return internalError(req, res, error);
    }
  },
  /**
   * Upload the file to the Cellar strage
   * @param Body {*} - file data
   * @param Key {string} - file name
   * @returns {Promise<void>}
   */
  uploadFile: (Body, Key = '') => S3.putObject({ Body, Bucket, Key }).promise(),
};
