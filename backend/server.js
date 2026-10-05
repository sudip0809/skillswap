require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initSocket = require('./socket');
const startScheduler = require('./utils/scheduler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/swaps', require('./routes/swaps'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(require('./middleware/error'));

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  initSocket(io);
  startScheduler(io);
  server.listen(PORT, () => console.log(`SkillSwap API running on http://localhost:${PORT}`));
});
