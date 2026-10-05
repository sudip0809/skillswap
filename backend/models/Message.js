const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
module.exports = mongoose.model('Message', new mongoose.Schema({
  swap: { type: ObjectId, ref: 'Swap', required: true, index: true },
  sender: { type: ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  readAt: { type: Date, default: null }
}, { timestamps: true }));
