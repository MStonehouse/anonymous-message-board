const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReplySchema = new Schema({
  text: {type: String, trim: true, required: true},
  reported: {type: Boolean, required: true},
  delete_password: {type: String, trim: true, required: true},
  created_on: {type: Date}
})

module.exports = mongoose.model('Reply', ReplySchema);