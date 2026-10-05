const Notification = require('../models/Notification');
module.exports = async (io, userId, { type = 'info', message, link = '' }) => {
  const n = await Notification.create({ user: userId, type, message, link });
  io.to(`user:${userId}`).emit('notification', n);
  return n;
};
