const jwt = require('jsonwebtoken');
const { getSwap } = require('./utils/access');

module.exports = io => {
  io.use((socket, next) => {
    try {
      const p = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
      socket.userId = p.id;
      next();
    } catch { next(new Error('unauthorized')); }
  });
  io.on('connection', socket => {
    socket.join(`user:${socket.userId}`);
    socket.on('swap:join', async (swapId, ack) => {
      try { await getSwap(swapId, socket.userId); socket.join(`swap:${swapId}`); ack && ack({ ok: true }); }
      catch (e) { ack && ack({ ok: false, message: e.message }); }
    });
    socket.on('swap:leave', swapId => socket.leave(`swap:${swapId}`));
    socket.on('typing', ({ swapId, isTyping }) => {
      if (socket.rooms.has(`swap:${swapId}`)) socket.to(`swap:${swapId}`).emit('typing', { swap: swapId, userId: socket.userId, isTyping: !!isTyping });
    });
  });
};
