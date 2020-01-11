module.exports = ({ Schema }) => new Schema({
  userId: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
  hash: String,
  isDeleted: {
    default: false,
    type: Boolean,
  },
  created: Number,
  updated: Number,
  entity: {
    default: 'Password',
    type: String,
  },
});
