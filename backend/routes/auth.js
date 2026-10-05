const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, signToken } = require('../middleware/auth');
const ah = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

router.post('/register', ah(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw httpError(400, 'Name, email and password are required');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  if (await User.findOne({ email: email.toLowerCase() })) throw httpError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  const obj = user.toObject(); delete obj.password;
  res.status(201).json({ token: signToken(user._id), user: obj });
}));

router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password || '', user.password))) throw httpError(401, 'Wrong email or password');
  const obj = user.toObject(); delete obj.password;
  res.json({ token: signToken(user._id), user: obj });
}));

router.get('/me', protect, (req, res) => res.json({ user: req.user }));
module.exports = router;
