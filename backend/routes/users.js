const router = require('express').Router();
const User = require('../models/User');
const Swap = require('../models/Swap');
const Review = require('../models/Review');
const Session = require('../models/Session');
const { protect } = require('../middleware/auth');
const { score } = require('../utils/matching');
const ah = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const cleanSkills = arr => {
  const seen = new Set();
  return (Array.isArray(arr) ? arr : [])
    .map(s => ({ name: String((s && s.name) || '').trim(), level: User.LEVELS.includes(s && s.level) ? s.level : 'Beginner' }))
    .filter(s => s.name && !seen.has(s.name.toLowerCase()) && seen.add(s.name.toLowerCase()));
};

router.put('/profile', protect, ah(async (req, res) => {
  const { bio = '', city = '', skillsTeach, skillsWant, languages, learningMode = 'online' } = req.body;
  const teach = cleanSkills(skillsTeach), want = cleanSkills(skillsWant);
  const langs = [...new Set((Array.isArray(languages) ? languages : []).map(l => String(l).trim()).filter(Boolean))];
  if (!teach.length) throw httpError(400, 'Add at least one skill you can teach');
  if (!want.length) throw httpError(400, 'Add at least one skill you want to learn');
  if (!langs.length) throw httpError(400, 'Add at least one language');
  if (!['online', 'offline', 'both'].includes(learningMode)) throw httpError(400, 'Invalid learning mode');
  Object.assign(req.user, { bio, city, skillsTeach: teach, skillsWant: want, languages: langs, learningMode, profileComplete: true });
  await req.user.save();
  res.json({ user: req.user });
}));

router.get('/:id', protect, ah(async (req, res) => {
  const u = await User.findById(req.params.id).select(User.PUBLIC);
  if (!u) throw httpError(404, 'User not found');
  const me = req.user._id;
  const [reviews, swap, sessionsCompleted] = await Promise.all([
    Review.find({ reviewee: u._id }).sort('-createdAt').limit(10).populate('reviewer', 'name'),
    Swap.findOne({ status: { $in: ['pending', 'accepted'] }, $or: [{ from: me, to: u._id }, { from: u._id, to: me }] }),
    Session.countDocuments({ status: 'completed', $or: [{ teacher: u._id }, { learner: u._id }] })
  ]);
  const match = String(u._id) === String(me) ? null : score(req.user, u);
  res.json({ user: u, reviews, match, swap, sessionsCompleted });
}));
module.exports = router;
