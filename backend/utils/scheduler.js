const Session = require('../models/Session');
const notify = require('./notify');

module.exports = io => {
  const ping = s => io.to(`swap:${s.swap}`).emit('session:update', { swap: String(s.swap) });
  const tick = async () => {
    try {
      const now = new Date();
      const soon = await Session.find({ status: 'scheduled', reminderSent: false, startAt: { $gte: now, $lte: new Date(now.getTime() + 30 * 60000) } });
      for (const s of soon) {
        s.reminderSent = true; await s.save();
        for (const uid of [s.teacher, s.learner]) {
          await notify(io, uid, { type: 'reminder', message: `Reminder: your ${s.skill} session starts soon`, link: `/swaps/${s.swap}` });
        }
        ping(s);
      }
      const missed = await Session.find({ status: 'scheduled', endAt: { $lt: now } });
      for (const s of missed) { s.status = 'missed'; s.history.push({ action: 'missed', note: 'Nobody joined' }); await s.save(); ping(s); }
      const stale = await Session.find({ status: 'proposed', startAt: { $lt: now } });
      for (const s of stale) { s.status = 'cancelled'; s.cancelReason = 'Proposal expired'; s.history.push({ action: 'expired' }); await s.save(); ping(s); }
    } catch (e) { console.error('scheduler:', e.message); }
  };
  setInterval(tick, 60 * 1000);
  tick();
};
