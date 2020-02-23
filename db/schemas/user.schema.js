const { ACCOUNT_STATUSES } = require('../../config');

module.exports = ({ Schema }) => {
  const User = new Schema({
    about: String,
    accountStatus: {
      default: ACCOUNT_STATUSES.active,
      type: String,
    },
    avatarLink: {
      default: null,
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

  // eanble populating virual fields
  User.set('toObject', { virtuals: true });
  User.set('toJSON', { virtuals: true });

  // add a virtual property TODO: fix this
  User.virtual('fullName').get(function getFullName() {
    return `${this.firstName} ${this.lastName}`;
  });

  return User;
};
