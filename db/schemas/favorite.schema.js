module.exports = ({ Schema }) => new Schema({
  postId: {
    ref: 'Post',
    type: Schema.Types.ObjectId,
  },
  userId: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
  isDeleted: {
    default: false,
    type: Boolean,
  },
  created: Number,
  updated: Number,
  entity: {
    default: 'Favorite',
    type: String,
  },
});
