const { ENV, ENVS } = require('../config');

/**
 * Get timestamp in seconds
 * @returns {number}
 */
const getSeconds = () => Math.ceil(Date.now() / 1000);

/**
 * Show console log
 * @param text {string} - string to log 
 * @param data {*} - additional data to log
 * @returns {void}
 */
const log = (text = '', data = null) => ENV === ENVS.dev && console.log(`${text}`, data || '');

module.exports = {
  getSeconds,
  log,
};
