const { downloadFile } = require('../../services/aws');

const { basic } = require('../../services/responses');
const { RESPONSE_STATUSES: rs } = require('../../config');

/**
 * Download the image
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {void|Promise<void>}
 */
module.exports = (req, res) => {
  // check the file name
  const { name = '' } = req.params;
  if (!name) {
    return basic(req, res, rs[400], 'MISSING_FILE_NAME');
  }

  return downloadFile(req, res, name);
};
