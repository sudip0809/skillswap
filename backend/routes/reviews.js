const router = require('express').Router();
const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getSwap, idOf, emitSwap } = require('../utils/access');
const notify = require('../utils/notify');
const ah = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

router.get('/', protect, ah(async (req, res) => {
  const swap = await getSwap(req.query.swap, req.user._id);
  res.json(await Review.find({ swap: swap._id }).populate('reviewer reviewee', 'name'));
}));

router.post('/', protect, ah(async (req, res) => {
  const me = String(req.user._id);
  const s = await Session.findById(req.body.sessionId);
  if (!s || ![s.teacher, s.learner].some(u => idOf(u) === me)) throw httpError(404, 'Session not found');
  if (s.status !== 'completed') throw httpError(400, 'You can review a session after it is completed');
  const rating = Number(req.body.rating);
  if (!(rating >= 1 && rating <= 5)) throw httpError(400, 'Pick a rating from 1 to 5');
  if (await Review.findOne({ session: s._id, reviewer: me })) throw httpError(409, 'You already reviewed this session');
  const reviewee = idOf(s.teacher) === me ? s.learner : s.teacher;
  const review = await Review.create({ swap: s.swap, session: s._id, reviewer: me, reviewee, rating, comment: String(req.body.comment || '').slice(0, 500) });
  const [agg] = await Review.aggregate([{ $match: { reviewee } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
  await User.findByIdAndUpdate(reviewee, { ratingAvg: Math.round(agg.avg * 10) / 10, ratingCount: agg.n });
  await notify(req.app.get('io'), reviewee, { type: 'review', message: `${req.user.name} rated you ${rating}/5 for ${s.skill}`, link: `/swaps/${s.swap}` });
  emitSwap(req, s.swap, 'session:update');
  res.status(201).json(review);
}));
module.exports = router;
