const router = require('express').Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const ah = require('../utils/asyncHandler');

router.get('/', protect, ah(async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(50),
    Notification.countDocuments({ user: req.user._id, read: false })
  ]);
  res.json({ items, unread });
}));
router.post('/read-all', protect, ah(async (req, res) => { await Notification.updateMany({ user: req.user._id, read: false }, { read: true }); res.json({ ok: true }); }));
router.post('/:id/read', protect, ah(async (req, res) => { await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true }); res.json({ ok: true }); }));
module.exports = router;
