const { ACCOUNT_STATUSES } = require('../../config');

module.exports = ({ Schema }) => {
  const User = new Schema({
    avatarLink: {
      default: null,
      type: String,
    },
    accountStatus: {
      default: ACCOUNT_STATUSES.active,
      type: String,
    },
    email: String,
    emailIsVerified: {
      default: false,
      type: Boolean,
    },
    failedLoginAttempts: {
      default: 0,
      type: Number,
    },
    firstName: String,
    lastName: String,
    role: {
      default: 'user',
      type: String,
    },
    isDeleted: {
      default: false,
      type: Boolean,
    },
    created: Number,
    updated: Number,
    entity: {
      default: 'User',
      type: String,
    },
  });

  // add a virtual property
  User.virtual('fullName').get(() => `${this.firstName} ${this.lastName}`);

  return User;
};
