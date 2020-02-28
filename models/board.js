const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BoardSchema = new Schema({
  name: {type: String, required: true},
  threads: [{type: Schema.Types.ObjectId, ref: 'Thread'}]
  // all _ids stored in threads must be document _ids from thread model
});

module.exports = mongoose.model('Board', BoardSchema);