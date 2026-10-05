const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
module.exports = mongoose.model('Resource', new mongoose.Schema({
  swap: { type: ObjectId, ref: 'Swap', required: true, index: true },
  session: { type: ObjectId, ref: 'Session', default: null },
  uploader: { type: ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: ['file', 'link'], default: 'file' },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 300 },
  originalName: String,
  filename: String,
  mimeType: String,
  size: Number,
  url: String,
  shared: { type: Boolean, default: false }
}, { timestamps: true }));
