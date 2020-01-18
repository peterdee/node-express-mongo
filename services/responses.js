const config = require('../config');
const { createInternalErrorTemplate } = require('./templates');
const { log } = require('./utilities');
const sendEmail = require('./mailer');
const stringify = require('./stringify');

const { RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

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
  /**
   * Handle an internal error
   * @param req {object} - request object
   * @param res {object} - response object
   * @param error {object|string|*} - error object or string
   * @param misc {string} - additional response info (not required)
   * @return {*}
   */
  internalError: (req, res, error, misc = sm.noAdditionalInformation) => {
    // send an email with a stringified error
    const { message, subject } = createInternalErrorTemplate(stringify(error));
    sendEmail(config.MAIL_SERVICE.email, subject, message);

    // dump the log into the console
    log('-- INTERNAL SERVER ERROR:\n', error);

    return res.status(rs[500]).send({
      datetime: Date.now(),
      info: sm.internalServerError,
      misc,
      request: `${req.originalUrl} [${req.method}]`,
      status: rs[500],
    });
  },
  /**
   * Send an email about a special server error
   * @param error {object|string|*} - error object or string
   * @param func {string} - name of the function that produced an error
   * @return {*}
   */
  specialError: (error, func = '') => {
    // dump the log into the console
    log(`-- SPECIAL SERVER ERROR @ ${func}:\n`, error);

    // send an email with a stringified error and function name
    const { message, subject } = createSpecialErrorTemplate(stringify(error), func);
    return sendEmail(config.MAIL_SERVICE.email, subject, message);
  },
};
