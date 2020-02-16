module.exports = ({ Schema }) => new Schema({
  data: String,
  mimeType: String,
  uid: String,
  isDeleted: {
    default: false,
    type: Boolean,
  },
  created: Number,
  updated: Number,
  entity: {
    default: 'Image',
    type: String,
  },
});
