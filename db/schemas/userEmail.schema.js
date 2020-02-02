module.exports = ({ Schema }) => new Schema({
  userId: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
  emailVerificationCodeId: {
    ref: 'EmailVerificationCode',
    type: Schema.Types.ObjectId,
  },
  newEmail: String,
  oldEmail: String,
  isDeleted: {
    default: false,
    type: Boolean,
  },
  created: Number,
  updated: Number,
  entity: {
    default: 'UserEmail',
    type: String,
  },
});
