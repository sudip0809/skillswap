const jwt = require('jsonwebtoken');
const User = require('../models/User');
const httpError = require('../utils/httpError');
const ah = require('../utils/asyncHandler');

exports.protect = ah(async (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw httpError(401, 'Please log in');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { throw httpError(401, 'Session expired, please log in again'); }
  const user = await User.findById(payload.id);
  if (!user) throw httpError(401, 'Account not found');
  req.user = user;
  next();
});
exports.signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
