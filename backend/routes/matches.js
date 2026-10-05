const router = require('express').Router();
const User = require('../models/User');
const Swap = require('../models/Swap');
const { protect } = require('../middleware/auth');
const { score } = require('../utils/matching');
const ah = require('../utils/asyncHandler');

router.get('/', protect, ah(async (req, res) => {
  const { q = '', type = '', mode = '' } = req.query;
  const me = req.user;
  const users = await User.find({ _id: { $ne: me._id }, profileComplete: true }).select(User.PUBLIC);
  const swaps = await Swap.find({ status: { $in: ['pending', 'accepted'] }, $or: [{ from: me._id }, { to: me._id }] });
  const rel = {};
  swaps.forEach(s => { const o = String(s.from) === String(me._id) ? s.to : s.from; rel[String(o)] = { id: s._id, status: s.status }; });

  let list = users.map(u => ({ user: u, match: score(me, u), swap: rel[String(u._id)] || null })).filter(x => x.match);
  if (type) list = list.filter(x => x.match.type === type);
  if (mode) list = list.filter(x => x.user.learningMode === mode || x.user.learningMode === 'both');
  if (q) {
    const t = q.toLowerCase();
    list = list.filter(x => x.user.name.toLowerCase().includes(t) || [...x.user.skillsTeach, ...x.user.skillsWant].some(s => s.name.toLowerCase().includes(t)));
  }
  list.sort((a, b) => b.match.score - a.match.score);
  res.json(list);
}));
module.exports = router;
