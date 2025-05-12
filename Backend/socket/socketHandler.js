const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { Message, User } = require('../models');

const authMiddleware = async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error();
    socket.user = user;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
};

module.exports = function attachSocket(server) {
  const io = socketIo(server, {
    cors: { origin: 'http://localhost:3000', methods: ['GET','POST'] }
  });

  io.use(authMiddleware).on('connection', socket => {
    console.log('New client connected');

    socket.on('join_channel', channelId => {
      socket.join(channelId);
    });

    socket.on('send_message', async data => {
      const msg = new Message({
        content: data.content,
        author: socket.user._id,
        channel: data.channelId
      });
      await msg.save();
      await msg.populate('author', 'username avatar');
      io.to(data.channelId).emit('receive_message', msg);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};
