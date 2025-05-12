// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');

const connectDB = require('./config/db');
const attachSocket = require('./socket/socketHandler');

const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const serverRoutes = require('./routes/servers');

const app = express();
const server = http.createServer(app);

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/servers', serverRoutes);

attachSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});