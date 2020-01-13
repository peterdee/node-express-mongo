const { SERVER_MESSAGES: sm } = require('../config');

// available responses
module.exports = {
  /**
   * Handle basic response without any data
   * @param req {object} - request object
   * @param res {object} - response object
   * @param status {number} - status of the response
   * @param info {string} - response info
   * @param misc {string} - additional response info (not required)
   * @returns {*|void|boolean}
   */
  basic: (req, res, status, info, misc = sm.noAdditionalInformation) => res.status(status).send({
    datetime: Date.now(),
    info,
    misc,
    request: `${req.originalUrl} [${req.method}]`,
    status,
  }),
  /**
   * Handle response with data
   * @param req {object} - request object
   * @param res {object} - response object
   * @param status {number} - status of the response
   * @param info {string} - response info
   * @param data {*} - response data
   * @param misc {string} - additional response info (not required)
   * @returns {*|void|boolean}
   */
  data: (req, res, status, info, data, misc = sm.noAdditionalInformation) => res.status(status).send({
    data,
    datetime: Date.now(),
    info,
    misc,
    request: `${req.originalUrl} [${req.method}]`,
    status,
  }),
};
