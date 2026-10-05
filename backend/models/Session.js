const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const s = new mongoose.Schema({
  swap: { type: ObjectId, ref: 'Swap', required: true, index: true },
  proposedBy: { type: ObjectId, ref: 'User', required: true },
  teacher: { type: ObjectId, ref: 'User', required: true },
  learner: { type: ObjectId, ref: 'User', required: true },
  skill: { type: String, required: true },
  notes: { type: String, default: '', maxlength: 500 },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  duration: { type: Number, required: true },
  mode: { type: String, enum: ['online', 'offline'], default: 'online' },
  meetingLink: { type: String, default: '' },
  location: { type: String, default: '' },
  status: { type: String, enum: ['proposed', 'scheduled', 'in_progress', 'completed', 'rejected', 'cancelled', 'missed'], default: 'proposed' },
  cancelReason: { type: String, default: '' },
  reminderSent: { type: Boolean, default: false },
  history: [{ action: String, by: { type: ObjectId, ref: 'User' }, at: { type: Date, default: Date.now }, note: String }]
}, { timestamps: true });
s.index({ teacher: 1, startAt: 1 });
s.index({ learner: 1, startAt: 1 });
module.exports = mongoose.model('Session', s);
