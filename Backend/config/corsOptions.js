const allowedOrigins = [
  'http://localhost:3000',
  'https://vibe-sync-glqp.vercel.app'
];

module.exports = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};