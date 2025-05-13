const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const authRouter = require('./routes/auth');
const { User, Server, Channel, Message } = require('./models');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.use('/api/auth', authRouter);

const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Socket event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinChannel', ({ channelId }) => {
    socket.join(channelId);
  });

  socket.on('sendMessage', async ({ channelId, userId, text }) => {
    try {
      const message = await Message.create({
        channel: channelId,
        sender: userId,
        text,
      });
      io.to(channelId).emit('newMessage', message);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 4000;
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      heartbeatFrequencyMS: 30000,
    });
    console.log('MongoDB connected');

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
const serversRouter = require('./routes/servers');
app.use('/api/servers', serversRouter);

connectDB();