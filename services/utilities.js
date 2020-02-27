const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../config');

const { ENV, ENVS, TOKENS } = config;

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
 * Format data for the paginated response
 * @param count {number} - total count of the elements
 * @param data {*[]} - data array
 * @param pagination {{ limit: number, page: number }} - pagination object
 * @returns {{
 *   data: *[],
 *   pagination: {
 *     currentPage: number,
 *     limit: number,
 *     totalItems: number,
 *     totalPages: number
 *   }
 * }}
 */
const formatPaginatedResponse = (count = 0, data = [], pagination = { limit: 1, page: 1 }) => ({
  data,
  pagination: {
    currentPage: pagination.page,
    limit: pagination.limit,
    totalItems: count,
    totalPages: Math.ceil(count / pagination.limit),
  },
});

/**
 * Generate random alpha-numeric string
 * @param length {number} - string length
 * @return {string}
 */
const generateString = (length = 16) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; i -= 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

/**
 * Generate image string
 * @param userId {number|string|null} - user ID
 * @returns {Promise<string>}
 */
const generateImage = (userId = null) => bcrypt.hash(
  `${userId}X${generateString(10)}X${Date.now()}X${generateString(10)}`,
  10,
);

/**
 * Generate access and refresh tokens for the user
 * @param id {number|string|null} - user ID
 * @param accessImage {string} - unique string for the access token
 * @param refreshImage {string} - unique string for the refresh token
 * @return {Promise<{access: *, refresh: *}>}
 */
const generateTokens = async (id = null, accessImage = '', refreshImage = '') => ({
  access: jwt.sign({ id, accessImage }, TOKENS.access.secret, { expiresIn: TOKENS.access.expiration }),
  refresh: jwt.sign({ id, refreshImage }, TOKENS.refresh.secret, { expiresIn: TOKENS.refresh.expiration }),
});

/**
 * Get timestamp in seconds
 * @returns {number}
 */
const getSeconds = () => Math.ceil(Date.now() / 1000);

/**
 * Check if the provided value is NUMBER
 * @param value {*} - value to check
 * @returns {boolean}
 */
const isNumber = (value) => !Number.isNaN(Number(value));

/**
 * Show console log
 * @param text {string} - string to log
 * @param data {*} - additional data to log
 * @returns {void}
 */
/* eslint-disable-next-line */
const log = (text = '', data = null) => ENV === ENVS.dev && console.log(`${text}`, data || '');

/**
 * Validate array of the provided values: check data types
 * @param items {object[]} - array of objects to validate
 * @returns {string[]}
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
  formatPaginatedResponse,
  getSeconds,
  generateImage,
  generateString,
  generateTokens,
  isNumber,
  log,
  validateData,
};
