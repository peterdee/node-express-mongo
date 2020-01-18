const { stringify } = require('flatted/cjs');

/**
 * Safely convert the object into string
 * @param value {*} - value to convert
 * @returns {string|*}
 */
module.exports = (value) => {
  // check the type of the value
  if (typeof value !== 'object') {
    return value;
  }

  // try to convert the value with JSON.stringify(), use flatted if there's an error
  try {
    return JSON.stringify(value);
  } catch (error) {
    return stringify(value);
  }
};
