const bcrypt = require('bcrypt');

const { basic, data, internalError } = require('../../services/responses');
const config = require('../../config');
const db = require('../../db');
const utils = require('../../services/utilities');

const { DATA_TYPES, RESPONSE_STATUSES: rs, SERVER_MESSAGES: sm } = config;

/**
 * Change user's password
 * @param req {object} - request object
 * @param res {object} - response object
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  try {
    // check and validate data
    const { newPassword, oldPassword } = req.body;
    const expected = [
      { field: 'newPassword', type: DATA_TYPES.string, value: newPassword },
      { field: 'oldPassword', type: DATA_TYPES.string, value: oldPassword },
    ];
    const missing = utils.checkData(expected.map(({ field }) => field), req.body);
    if (missing.length > 0) {
      return data(req, res, rs[400], sm.missingData, { missing });
    }
    const invalid = utils.validateData(expected);
    if (invalid.length > 0) {
      return data(req, res, rs[400], sm.invalidData, { invalid });
    }

    // find password and user records
    const [passwordRecord, userRecord] = await Promise.all([
      db.Password.findOne({
        userId: req.id,
        isDeleted: false,
      }),
      db.User.findOne({
        id: req.id,
        isDeleted: false,
      }),
    ]);
    if (!(passwordRecord && userRecord)) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // compare hashes
    const comparison = await bcrypt.compare(oldPassword, passwordRecord.hash);
    if (!comparison) {
      return basic(req, res, rs[400], 'OLD_PASSWORD_IS_INVALID');
    }

    // create new hash
    // const hash = await bcrypt.hash(newPassword, 10);

    // TODO: update the password record

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
