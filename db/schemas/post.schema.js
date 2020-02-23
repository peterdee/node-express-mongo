module.exports = ({ Schema }) => new Schema({
  authorId: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
  content: String,
  imageLink: String,
  title: String,
  isDeleted: {
    default: false,
    type: Boolean,
  },
  created: Number,
  updated: Number,
  entity: {
    default: 'Post',
    type: String,
  },
});
