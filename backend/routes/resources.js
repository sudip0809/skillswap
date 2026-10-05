const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const Resource = require('../models/Resource');
const Session = require('../models/Session');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getSwap, otherId, idOf, emitSwap } = require('../utils/access');
const notify = require('../utils/notify');
const ah = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const DIR = path.join(__dirname, '..', 'uploads');
const dropFile = f => f && fs.unlink(path.join(DIR, f), () => {});

// my uploads + whatever my partner has shared with me
router.get('/', protect, ah(async (req, res) => {
  const swap = await getSwap(req.query.swap, req.user._id);
  const list = await Resource.find({ swap: swap._id, $or: [{ uploader: req.user._id }, { shared: true }] })
    .sort('-createdAt').populate('uploader', 'name').populate('session', 'skill startAt');
  res.json(list);
}));

router.post('/', protect, upload.single('file'), ah(async (req, res) => {
  const file = req.file;
  try {
    const swap = await getSwap(req.body.swap, req.user._id);
    if (!['accepted', 'ended'].includes(swap.status)) throw httpError(400, 'Swap is not active');
    const title = String(req.body.title || '').trim();
    const url = String(req.body.url || '').trim();
    if (!title) throw httpError(400, 'Give the resource a title');
    if (!file && !/^https?:\/\//i.test(url)) throw httpError(400, 'Attach a file or add a link starting with http(s)://');
    let session = null;
    if (req.body.session) {
      const s = await Session.findById(req.body.session);
      if (!s || idOf(s.swap) !== String(swap._id)) throw httpError(400, 'Session does not belong to this swap');
      session = s._id;
    }
    const r = await Resource.create({
      swap: swap._id, session, uploader: req.user._id, title, description: String(req.body.description || '').slice(0, 300),
      kind: file ? 'file' : 'link',
      ...(file ? { originalName: file.originalname, filename: file.filename, mimeType: file.mimetype, size: file.size } : { url })
    });
    res.status(201).json(r);
  } catch (e) { dropFile(file && file.filename); throw e; }
}));

router.get('/:id/download', protect, ah(async (req, res) => {
  const r = await Resource.findById(req.params.id);
  if (!r) throw httpError(404, 'Resource not found');
  const swap = await getSwap(r.swap, req.user._id);
  const mine = idOf(r.uploader) === String(req.user._id);
  if (!mine && !r.shared) throw httpError(403, 'This file has not been shared with you');
  if (r.kind !== 'file') throw httpError(400, 'Links cannot be downloaded');
  const p = path.join(DIR, r.filename);
  if (!fs.existsSync(p)) throw httpError(404, 'File is missing on the server');
  res.download(p, r.originalName);
}));

router.patch('/:id/share', protect, ah(async (req, res) => {
  const r = await Resource.findById(req.params.id);
  if (!r || idOf(r.uploader) !== String(req.user._id)) throw httpError(404, 'Resource not found');
  r.shared = !!req.body.shared;
  await r.save();
  const swap = await getSwap(r.swap, req.user._id);
  if (r.shared) await notify(req.app.get('io'), otherId(swap, req.user._id), { type: 'resource', message: `${req.user.name} shared "${r.title}" with you`, link: `/swaps/${swap._id}` });
  emitSwap(req, r.swap, 'resource:update');
  res.json(r);
}));

router.delete('/:id', protect, ah(async (req, res) => {
  const r = await Resource.findById(req.params.id);
  if (!r || idOf(r.uploader) !== String(req.user._id)) throw httpError(404, 'Resource not found');
  dropFile(r.filename);
  await r.deleteOne();
  emitSwap(req, r.swap, 'resource:update');
  res.json({ ok: true });
}));
module.exports = router;
