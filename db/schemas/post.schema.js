module.exports = ({ Schema }) => new Schema({
  authorId: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
  authorName: String,
  content: String,
  imageLink: String,
  rawText: String,
  subtitle: String,
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
