// server.js
const express = require('express');
const http    = require('http');
const dotenv  = require('dotenv');
const cors    = require('cors');
const { Server } = require('socket.io');
const connectDB   = require('./config/db');
const routes      = require('./routes');
const { setupSocket } = require('./socket');

// 1. Load env vars
dotenv.config();

// 2. Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://vibe-sync-glqp.vercel.app'
  // add any others you need here
];

// 3. CORS options (array shorthand + full methods/headers)
const corsOptions = {
  origin:         allowedOrigins,             // built-in allow list
  methods:        ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-auth-token'],
  credentials:    true,
  optionsSuccessStatus: 200
};

const app    = express();
const server = http.createServer(app);

// 4. Explicitly handle all OPTIONS preflight before anything else
app.options('*', cors(corsOptions));

// 5. Apply CORS to all routes
app.use(cors(corsOptions));

// 6. Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 7. Connect to database
connectDB();

// 8. Root health check
app.get('/', (req, res) => res.send('Hello World!'));

// 9. Mount your routes (no /api prefix)
app.use(routes);

// 10. Static uploads
app.use('/uploads', express.static('uploads'));

// 11. Socket.IO with same CORS settings
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 20000
});
setupSocket(io);

// 12. Start listening
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});