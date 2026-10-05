const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const s = new mongoose.Schema({
  from: { type: ObjectId, ref: 'User', required: true },
  to: { type: ObjectId, ref: 'User', required: true },
  offeredSkill: { type: String, required: true },   // taught by "from"
  wantedSkill: { type: String, required: true },    // taught by "to"
  message: { type: String, default: '', maxlength: 500 },
  matchScore: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled', 'ended'], default: 'pending' }
}, { timestamps: true });
s.index({ from: 1, to: 1 });
module.exports = mongoose.model('Swap', s);
