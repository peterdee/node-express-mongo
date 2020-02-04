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

    // find password record
    const passwordRecord = await db.Password.findOne({
      userId: req.id,
      isDeleted: false,
    });
    if (!passwordRecord) {
      return basic(req, res, rs[401], sm.accessDenied);
    }

    // compare hashes
    const comparison = await bcrypt.compare(oldPassword, passwordRecord.hash);
    if (!comparison) {
      return basic(req, res, rs[400], 'OLD_PASSWORD_IS_INVALID');
    }

    // create new images and password hash, mark all of the refresh tokens as deleted
    const seconds = utils.getSeconds();
    const query = {
      userId: req.id,
      isDeleted: false,
    };
    const [accessImage, refreshImage, hash] = await Promise.all([
      utils.generateImage(req.id),
      utils.generateImage(req.id),
      bcrypt.hash(newPassword, 10),
      db.RefreshToken.updateMany(query, {
        isDeleted: true,
        updated: seconds,
      }),
    ]);

    // generate new set of tokens
    const tokens = await utils.generateTokens(req.id, accessImage, refreshImage);

    // create new Refresh Token
    const RefreshToken = new db.RefreshToken({
      userId: req.id,
      refreshImage,
      token: tokens.refresh,
      expirationDate: `${Date.now() + (config.TOKENS.refresh.expiration * 1000)}`,
      created: seconds,
      updated: seconds,
    });

    // save updates
    await Promise.all([
      db.AccessImage.updateMany(query, {
        image: accessImage,
        updated: seconds,
      }),
      db.Password.updateOne(
        {
          id: passwordRecord.id,
        },
        {
          hash,
          updated: seconds,
        },
      ),
      RefreshToken.save(),
    ]);

    return basic(req, res, rs[200], sm.ok);
  } catch (error) {
    return internalError(req, res, error);
  }
};
