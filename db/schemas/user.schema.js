module.exports = ({ Schema }) => {
  const User = new Schema({
    email: String,
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
