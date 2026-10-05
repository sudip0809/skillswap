const mongoose = require('mongoose');
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const skill = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 40 },
  level: { type: String, enum: LEVELS, default: 'Beginner' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  bio: { type: String, default: '', maxlength: 500 },
  city: { type: String, default: '', trim: true },
  skillsTeach: [skill],
  skillsWant: [skill],
  languages: [{ type: String, trim: true }],
  learningMode: { type: String, enum: ['online', 'offline', 'both'], default: 'online' },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  profileComplete: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
module.exports.LEVELS = LEVELS;
module.exports.PUBLIC = 'name bio city skillsTeach skillsWant languages learningMode ratingAvg ratingCount profileComplete createdAt';
