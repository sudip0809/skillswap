const router = require('express').Router();
const Session = require('../models/Session');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const { getSwap, idOf, emitSwap } = require('../utils/access');
const notify = require('../utils/notify');
const ah = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const ACTIVE = ['proposed', 'scheduled', 'in_progress'];
const POP = [{ path: 'teacher learner', select: 'name' }, { path: 'swap', select: 'from to status offeredSkill wantedSkill' }];
const partner = (s, me) => (idOf(s.teacher) === String(me) ? idOf(s.learner) : idOf(s.teacher));
const isMember = (s, me) => [s.teacher, s.learner].some(u => idOf(u) === String(me));

async function findConflict(userIds, startAt, endAt, excludeId) {
  const q = {
    status: { $in: ACTIVE },
    $or: [{ teacher: { $in: userIds } }, { learner: { $in: userIds } }],
    startAt: { $lt: endAt }, endAt: { $gt: startAt }
  };
  if (excludeId) q._id = { $ne: excludeId };
  return Session.findOne(q);
}

function parseSlot(b) {
  const startAt = new Date(b.startAt);
  const duration = Number(b.duration);
  if (isNaN(startAt)) throw httpError(400, 'Choose a valid date and time');
  if (startAt <= new Date()) throw httpError(400, 'Pick a time in the future');
  if (!(duration >= 15 && duration <= 480)) throw httpError(400, 'Duration must be between 15 and 480 minutes');
  const mode = b.mode === 'offline' ? 'offline' : 'online';
  const meetingLink = String(b.meetingLink || '').trim(), location = String(b.location || '').trim();
  if (mode === 'online' && !/^https?:\/\//i.test(meetingLink)) throw httpError(400, 'Add a meeting link starting with http:// or https://');
  if (mode === 'offline' && !location) throw httpError(400, 'Add the place where you will meet');
  return { startAt, endAt: new Date(startAt.getTime() + duration * 60000), duration, mode, meetingLink: mode === 'online' ? meetingLink : '', location: mode === 'offline' ? location : '', notes: String(b.notes || '').slice(0, 500) };
}

async function ensureFree(s, slot, excludeId) {
  const c = await findConflict([s.teacher, s.learner], slot.startAt, slot.endAt, excludeId);
  if (c) throw httpError(409, 'One of you already has a session at that time. Choose a new time.', { conflict: true });
}

router.get('/', protect, ah(async (req, res) => {
  const me = req.user._id;
  const q = { $or: [{ teacher: me }, { learner: me }] };
  if (req.query.swap) { await getSwap(req.query.swap, me); q.swap = req.query.swap; }
  const sessions = await Session.find(q).sort('startAt').populate(POP);
  const reviews = await Review.find({ session: { $in: sessions.map(s => s._id) }, reviewer: me });
  const mine = Object.fromEntries(reviews.map(r => [String(r.session), r]));
  res.json(sessions.map(s => ({ ...s.toObject(), myReview: mine[String(s._id)] || null })));
}));

router.post('/', protect, ah(async (req, res) => {
  const me = req.user;
  const swap = await getSwap(req.body.swapId, me._id);
  if (swap.status !== 'accepted') throw httpError(400, 'Sessions can only be planned in an active swap');
  const teacher = String(req.body.teacher);
  const fromTeaches = teacher === String(swap.from), toTeaches = teacher === String(swap.to);
  if (!fromTeaches && !toTeaches) throw httpError(400, 'Choose who teaches');
  const skill = fromTeaches ? swap.offeredSkill : swap.wantedSkill;
  const slot = parseSlot(req.body);
  const learner = fromTeaches ? swap.to : swap.from;
  const probe = { teacher: swap.from, learner: swap.to };
  await ensureFree(probe, slot);
  const s = await Session.create({ swap: swap._id, proposedBy: me._id, teacher, learner, skill, ...slot, history: [{ action: 'proposed', by: me._id }] });
  const other = partner(s, me._id);
  await notify(req.app.get('io'), other, { type: 'session', message: `${me.name} proposed a ${skill} session on ${slot.startAt.toLocaleDateString()}`, link: `/swaps/${swap._id}` });
  emitSwap(req, swap._id, 'session:update');
  res.status(201).json(s);
}));

// reschedule: puts the session back to "proposed" so the other person confirms
router.patch('/:id', protect, ah(async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s || !isMember(s, req.user._id)) throw httpError(404, 'Session not found');
  if (!['proposed', 'scheduled'].includes(s.status)) throw httpError(400, 'This session can no longer be changed');
  const slot = parseSlot(req.body);
  await ensureFree(s, slot, s._id);
  Object.assign(s, slot, { status: 'proposed', proposedBy: req.user._id, reminderSent: false });
  s.history.push({ action: 'rescheduled', by: req.user._id });
  await s.save();
  await notify(req.app.get('io'), partner(s, req.user._id), { type: 'session', message: `${req.user.name} suggested a new time for your ${s.skill} session`, link: `/swaps/${s.swap}` });
  emitSwap(req, s.swap, 'session:update');
  res.json(s);
}));

router.post('/:id/respond', protect, ah(async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s || !isMember(s, req.user._id)) throw httpError(404, 'Session not found');
  if (s.status !== 'proposed') throw httpError(400, 'This proposal was already answered');
  if (idOf(s.proposedBy) === String(req.user._id)) throw httpError(403, 'The other person has to respond to your proposal');
  const accept = req.body.action === 'accept';
  if (accept) {
    if (s.startAt <= new Date()) throw httpError(400, 'This time has passed. Ask for a new one.');
    await ensureFree(s, { startAt: s.startAt, endAt: s.endAt }, s._id);
  }
  s.status = accept ? 'scheduled' : 'rejected';
  s.history.push({ action: accept ? 'accepted' : 'declined', by: req.user._id });
  await s.save();
  await notify(req.app.get('io'), s.proposedBy, { type: 'session', message: `${req.user.name} ${accept ? 'accepted' : 'declined'} your ${s.skill} session`, link: `/swaps/${s.swap}` });
  emitSwap(req, s.swap, 'session:update');
  res.json(s);
}));

router.post('/:id/cancel', protect, ah(async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s || !isMember(s, req.user._id)) throw httpError(404, 'Session not found');
  if (!['proposed', 'scheduled'].includes(s.status)) throw httpError(400, 'This session cannot be cancelled');
  s.status = 'cancelled'; s.cancelReason = String(req.body.reason || '').slice(0, 200);
  s.history.push({ action: 'cancelled', by: req.user._id, note: s.cancelReason });
  await s.save();
  await notify(req.app.get('io'), partner(s, req.user._id), { type: 'session', message: `${req.user.name} cancelled the ${s.skill} session`, link: `/swaps/${s.swap}` });
  emitSwap(req, s.swap, 'session:update');
  res.json(s);
}));

// join / attend
router.post('/:id/start', protect, ah(async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s || !isMember(s, req.user._id)) throw httpError(404, 'Session not found');
  const now = new Date();
  if (s.status === 'in_progress') return res.json(s);
  if (s.status !== 'scheduled') throw httpError(400, 'Only scheduled sessions can be joined');
  if (now < new Date(s.startAt.getTime() - 15 * 60000)) throw httpError(400, 'You can join 15 minutes before the start time');
  if (now > s.endAt) throw httpError(400, 'This session time has ended');
  s.status = 'in_progress';
  s.history.push({ action: 'started', by: req.user._id });
  await s.save();
  await notify(req.app.get('io'), partner(s, req.user._id), { type: 'session', message: `${req.user.name} joined the ${s.skill} session`, link: `/swaps/${s.swap}` });
  emitSwap(req, s.swap, 'session:update');
  res.json(s);
}));

router.post('/:id/complete', protect, ah(async (req, res) => {
  const s = await Session.findById(req.params.id);
  if (!s || !isMember(s, req.user._id)) throw httpError(404, 'Session not found');
  if (s.status !== 'in_progress') throw httpError(400, 'Only a session in progress can be completed');
  s.status = 'completed';
  s.history.push({ action: 'completed', by: req.user._id });
  await s.save();
  await notify(req.app.get('io'), partner(s, req.user._id), { type: 'session', message: `Your ${s.skill} session is complete. Leave a review for ${req.user.name}.`, link: `/swaps/${s.swap}` });
  emitSwap(req, s.swap, 'session:update');
  res.json(s);
}));
module.exports = router;
