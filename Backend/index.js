const express = require('express');
const http    = require('http');
const dotenv  = require('dotenv');
const cors    = require('cors');
const { Server } = require('socket.io');
const connectDB   = require('./config/db');
const routes      = require('./routes');
const { setupSocket } = require('./socket');

dotenv.config();

const allowedOrigins = [
  'http://localhost:3000',
  'https://vibe-sync-glqp.vercel.app'
  // add any others you need here
];

const corsOptions = {
  origin:         allowedOrigins,             // built-in allow list
  methods:        ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-auth-token'],
  credentials:    true,
  optionsSuccessStatus: 200
};

const app    = express();
const server = http.createServer(app);

app.options('*', cors(corsOptions));

app.use(cors(corsOptions));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

connectDB();

app.get('/', (req, res) => res.send('Hello World!'));

app.use(routes);

app.use('/uploads', express.static('uploads'));

const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 20000
});
setupSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});