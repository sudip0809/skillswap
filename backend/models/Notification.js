const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
module.exports = mongoose.model('Notification', new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, default: 'info' },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false }
}, { timestamps: true }));
