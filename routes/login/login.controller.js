// const { data } = require('../../services/responses');
const { DATA_TYPES } = require('../../config');
// const db = require('../../db');
const utils = require('../../services/utilities');

/**
 * Login for a user
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const { email, password } = req.body;
    const expected = [
      { field: 'email', type: DATA_TYPES.string, value: email },
      { field: 'password', type: DATA_TYPES.string, value: password },
    ];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      utils.log('> res', res);
      // return data(req, res, )
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      // return data(ctx, statuses[400], sm.invalidData, { invalid });
    }

    return true;
  } catch (err) {
    return utils.log(err);
  }
};
