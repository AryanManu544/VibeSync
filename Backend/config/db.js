// config/db.js
const mongoose = require('mongoose');

module.exports = function connectDB() {
  return mongoose.connect(
    process.env.MONGO_URI || 'mongodb://localhost:27017/Vibesync',
    { useNewUrlParser: true, useUnifiedTopology: true }
  );
};