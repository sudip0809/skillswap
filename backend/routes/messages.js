const router = require('express').Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const { getSwap, emitSwap } = require('../utils/access');
const ah = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

router.get('/:swapId', protect, ah(async (req, res) => {
  const swap = await getSwap(req.params.swapId, req.user._id);
  const messages = await Message.find({ swap: swap._id }).sort('createdAt').limit(500);
  await Message.updateMany({ swap: swap._id, sender: { $ne: req.user._id }, readAt: null }, { readAt: new Date() });
  res.json(messages);
}));

router.post('/:swapId/read', protect, ah(async (req, res) => {
  const swap = await getSwap(req.params.swapId, req.user._id);
  await Message.updateMany({ swap: swap._id, sender: { $ne: req.user._id }, readAt: null }, { readAt: new Date() });
  res.json({ ok: true });
}));

router.post('/:swapId', protect, ah(async (req, res) => {
  const swap = await getSwap(req.params.swapId, req.user._id);
  if (swap.status !== 'accepted') throw httpError(400, 'Chat is available for active swaps only');
  const text = String(req.body.text || '').trim();
  if (!text) throw httpError(400, 'Message is empty');
  const msg = await Message.create({ swap: swap._id, sender: req.user._id, text });
  emitSwap(req, swap._id, 'message:new', { message: msg });
  req.app.get('io').to(`user:${String(swap.from) === String(req.user._id) ? swap.to : swap.from}`).emit('message:unread', { swap: String(swap._id) });
  res.status(201).json(msg);
}));
module.exports = router;
