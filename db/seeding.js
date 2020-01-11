const bcrypt = require('bcrypt');

const { DATABASE: DB, USER } = require('../config');
const { getSeconds, log } = require('../services/utilities');

/**
 * Do the database seeding if necessary
 * @param database {object} - database connection
 * @returns {void}
 */
module.exports = async (database) => {
  try {
    // check if seeding is enabled
    if (!DB.enableSeeding) {
      return log('-- database: seeding is disabled');
    }

    // check existing record
    const existing = await database.User.findOne({ email: USER.email });
    if (existing) {
      return log('-- database: seeding is not necessary');
    }

    // create User record
    const seconds = getSeconds();
    const User = new database.User({
      email: USER.email,
      firstName: USER.firstName,
      lastName: USER.lastName,
      role: 'admin',
      created: seconds,
      updated: seconds,
    });
    await User.save();

    // create hash
    const hash = await bcrypt.hash(USER.password, 10);

    // create Password record
    const Password = new database.Password({
      userId: User.id,
      hash,
      created: seconds,
      updated: seconds,
    });
    await Password.save();

    return log('-- database: seeding is done');
  } catch (error) {
    throw error;
  }
};
