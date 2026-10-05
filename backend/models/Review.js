const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const s = new mongoose.Schema({
  swap: { type: ObjectId, ref: 'Swap', required: true, index: true },
  session: { type: ObjectId, ref: 'Session', required: true },
  reviewer: { type: ObjectId, ref: 'User', required: true },
  reviewee: { type: ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 500 }
}, { timestamps: true });
s.index({ session: 1, reviewer: 1 }, { unique: true });
module.exports = mongoose.model('Review', s);
