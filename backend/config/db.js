const mongoose = require('mongoose');
module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillswap');
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Start MongoDB (or set MONGO_URI to an Atlas URL in backend/.env) and try again.');
    process.exit(1);
  }
};
