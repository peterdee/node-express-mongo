module.exports = ({ Schema }) => new Schema({
  postId: {
    ref: 'Post',
    type: Schema.Types.ObjectId,
  },
  authorId: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
  text: String,
  isDeleted: {
    default: false,
    type: Boolean,
  },
  created: Number,
  updated: Number,
  entity: {
    default: 'Comment',
    type: String,
  },
});
