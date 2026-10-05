const router = require('express').Router();
const Swap = require('../models/Swap');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const ah = require('../utils/asyncHandler');

router.get('/', protect, ah(async (req, res) => {
  const me = req.user._id;
  const mine = { $or: [{ teacher: me }, { learner: me }] };
  const POP = [{ path: 'teacher learner', select: 'name' }];
  const [activeSwaps, incomingRequests, outgoingRequests, upcoming, awaiting, done, notifications] = await Promise.all([
    Swap.find({ status: 'accepted', $or: [{ from: me }, { to: me }] }).select('_id'),
    Swap.countDocuments({ to: me, status: 'pending' }),
    Swap.countDocuments({ from: me, status: 'pending' }),
    Session.find({ ...mine, status: { $in: ['scheduled', 'in_progress'] }, endAt: { $gte: new Date() } }).sort('startAt').limit(5).populate(POP),
    Session.find({ ...mine, status: 'proposed', proposedBy: { $ne: me } }).sort('startAt').populate(POP),
    Session.find({ ...mine, status: 'completed' }),
    Notification.find({ user: me }).sort('-createdAt').limit(5)
  ]);
  const unreadMessages = await Message.countDocuments({ swap: { $in: activeSwaps.map(s => s._id) }, sender: { $ne: me }, readAt: null });
  const mins = f => done.filter(s => String(s[f]) === String(me)).reduce((a, s) => a + s.duration, 0);
  res.json({
    activeSwaps: activeSwaps.length, incomingRequests, outgoingRequests, unreadMessages,
    completedSessions: done.length,
    hoursTaught: Math.round(mins('teacher') / 6) / 10,
    hoursLearned: Math.round(mins('learner') / 6) / 10,
    rating: { avg: req.user.ratingAvg, count: req.user.ratingCount },
    upcoming, awaiting, notifications
  });
}));
module.exports = router;
