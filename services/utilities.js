const { ENV, ENVS } = require('../config');

/**
 * Check data fields in the request
 * @param fields {string[]} - array of the field names
 * @param source {object} - source object
 * @returns {string[]} - array of missing fields
 */
const checkData = (fields = [], source = {}) => fields.reduce((arr, item) => {
  if (!source[item]) arr.push(item);
  return arr;
}, []);

/**
 * Get timestamp in seconds
 * @returns {number}
 */
const getSeconds = () => Math.ceil(Date.now() / 1000);

/**
 * Show console log
 * @param text {string} - string to log
 * @param data {*} - additional data to log
 * @returns {*}
 */
const log = (text = '', data = null) => ENV === ENVS.dev && console.log(`${text}`, data || '');

/**
 * Validate array of the provided values: check data types
 * @param items {object[]} - array of objects to validate
 * @returns {*}
 */
const validateData = (items = []) => items.reduce((arr, { field = '', type = '', value }) => {
  /* eslint-disable */
  if (type === config.DATA_TYPES.boolean || type === config.DATA_TYPES.number
    || type === config.DATA_TYPES.object || type === config.DATA_TYPES.string
    && typeof value !== type) arr.push(field);
  if (type === config.DATA_TYPES.array && !Array.isArray(value)) arr.push(field);
  // if (type === config.DATA_TYPES.booleanString && !utils.isBoolean(value)) arr.push(field);
  // if (type === config.DATA_TYPES.numberString && !utils.isNumber(value)) arr.push(field);
  /* eslint-enable */
  return arr;
}, []);

module.exports = {
  checkData,
  getSeconds,
  log,
  validateData,
};
