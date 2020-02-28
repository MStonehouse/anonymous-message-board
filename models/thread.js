const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ThreadSchema = new Schema({
  text: {type: String, trim: true, required: true},
  reported: {type: Boolean, required: true},
  created_on: {type: Date},
  bumped_on: {type: Date},
  delete_password: {type: String, trim: true, required: true},
  replycount: {type: Number},
  replies: [{type: Schema.Types.ObjectId, ref: 'Reply'}],
})




module.exports = mongoose.model('Thread', ThreadSchema);