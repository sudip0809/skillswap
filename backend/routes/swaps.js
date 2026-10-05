const router = require('express').Router();
const User = require('../models/User');
const Swap = require('../models/Swap');
const Message = require('../models/Message');
const Session = require('../models/Session');
const { protect } = require('../middleware/auth');
const { score } = require('../utils/matching');
const { getSwap, otherId, emitSwap } = require('../utils/access');
const notify = require('../utils/notify');
const ah = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const POP = ['from', 'to'];
const FIELDS = 'name city languages ratingAvg ratingCount';

router.post('/', protect, ah(async (req, res) => {
  const me = req.user;
  const { to, offeredSkill, wantedSkill, message = '' } = req.body;
  if (String(to) === String(me._id)) throw httpError(400, "You can't swap with yourself");
  const other = await User.findById(to);
  if (!other || !other.profileComplete) throw httpError(404, 'User not found');
  const find = (arr, n) => arr.find(s => s.name.toLowerCase() === String(n || '').trim().toLowerCase());
  const mine = find(me.skillsTeach, offeredSkill), theirs = find(other.skillsTeach, wantedSkill);
  if (!mine) throw httpError(400, 'Choose a skill you teach');
  if (!theirs) throw httpError(400, `${other.name} does not teach that skill`);
  const existing = await Swap.findOne({ status: { $in: ['pending', 'accepted'] }, $or: [{ from: me._id, to: other._id }, { from: other._id, to: me._id }] });
  if (existing) throw httpError(409, existing.status === 'accepted' ? 'You already have an active swap with this person' : 'A request between you two is already pending');
  const m = score(me, other);
  const swap = await Swap.create({ from: me._id, to: other._id, offeredSkill: mine.name, wantedSkill: theirs.name, message, matchScore: m ? m.score : 0 });
  await notify(req.app.get('io'), other._id, { type: 'swap_request', message: `${me.name} wants to swap ${mine.name} for ${theirs.name}`, link: '/requests' });
  res.status(201).json(swap);
}));

// box: incoming | outgoing | active | all
router.get('/', protect, ah(async (req, res) => {
  const me = req.user._id;
  const { box = 'all' } = req.query;
  const q = box === 'incoming' ? { to: me, status: 'pending' }
    : box === 'outgoing' ? { from: me }
    : box === 'active' ? { status: { $in: ['accepted', 'ended'] }, $or: [{ from: me }, { to: me }] }
    : { $or: [{ from: me }, { to: me }] };
  const swaps = await Swap.find(q).sort('-updatedAt').populate(POP, FIELDS);
  const unread = await Message.aggregate([
    { $match: { swap: { $in: swaps.map(s => s._id) }, sender: { $ne: me }, readAt: null } },
    { $group: { _id: '$swap', n: { $sum: 1 } } }
  ]);
  const map = Object.fromEntries(unread.map(u => [String(u._id), u.n]));
  res.json(swaps.map(s => ({ ...s.toObject(), unread: map[String(s._id)] || 0 })));
}));

router.get('/:id', protect, ah(async (req, res) => res.json(await getSwap(req.params.id, req.user._id, true))));

router.post('/:id/respond', protect, ah(async (req, res) => {
  const swap = await getSwap(req.params.id, req.user._id);
  if (String(swap.to) !== String(req.user._id)) throw httpError(403, 'Only the receiver can respond');
  if (swap.status !== 'pending') throw httpError(400, 'This request was already answered');
  const accept = req.body.action === 'accept';
  swap.status = accept ? 'accepted' : 'rejected';
  await swap.save();
  await notify(req.app.get('io'), swap.from, {
    type: 'swap_response',
    message: accept ? `${req.user.name} accepted your swap request. Your exchange room is open.` : `${req.user.name} declined your swap request.`,
    link: accept ? `/swaps/${swap._id}` : '/requests'
  });
  res.json(swap);
}));

router.post('/:id/cancel', protect, ah(async (req, res) => {
  const swap = await getSwap(req.params.id, req.user._id);
  if (String(swap.from) !== String(req.user._id) || swap.status !== 'pending') throw httpError(400, 'Only your own pending requests can be cancelled');
  swap.status = 'cancelled';
  await swap.save();
  res.json(swap);
}));

router.post('/:id/end', protect, ah(async (req, res) => {
  const swap = await getSwap(req.params.id, req.user._id);
  if (swap.status !== 'accepted') throw httpError(400, 'Only active swaps can be ended');
  swap.status = 'ended';
  await swap.save();
  const open = await Session.find({ swap: swap._id, status: { $in: ['proposed', 'scheduled'] } });
  for (const s of open) { s.status = 'cancelled'; s.cancelReason = 'Swap ended'; s.history.push({ action: 'cancelled', by: req.user._id, note: 'Swap ended' }); await s.save(); }
  await notify(req.app.get('io'), otherId(swap, req.user._id), { type: 'swap_ended', message: `${req.user.name} marked your swap as finished`, link: `/swaps/${swap._id}` });
  emitSwap(req, swap._id, 'swap:update');
  res.json(swap);
}));
module.exports = router;
