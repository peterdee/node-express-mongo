module.exports = ({ Schema }) => new Schema({
  userId: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
  code: String,
  expirationDate: String,
  isDeleted: {
    default: false,
    type: Boolean,
  },
  created: Number,
  updated: Number,
  entity: {
    default: 'AccountRecoveryCode',
    type: String,
  },
});
