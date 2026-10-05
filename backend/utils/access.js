const Swap = require('../models/Swap');
const httpError = require('./httpError');
const idOf = x => String(x && x._id ? x._id : x);
async function getSwap(id, userId, populate = false) {
  let q = Swap.findById(id);
  if (populate) q = q.populate('from to', 'name city languages ratingAvg ratingCount');
  const swap = await q;
  if (!swap) throw httpError(404, 'Swap not found');
  if (![swap.from, swap.to].some(u => idOf(u) === String(userId))) throw httpError(403, 'This swap is not yours');
  return swap;
}
const otherId = (swap, userId) => (idOf(swap.from) === String(userId) ? idOf(swap.to) : idOf(swap.from));
const emitSwap = (req, swapId, event, payload = {}) => req.app.get('io').to(`swap:${swapId}`).emit(event, { swap: String(swapId), ...payload });
module.exports = { getSwap, otherId, idOf, emitSwap };
