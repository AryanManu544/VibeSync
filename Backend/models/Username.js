const mongoose = require('mongoose');

const usernameSchema = new mongoose.Schema({
  name: String,
  count: Number
});

module.exports = mongoose.model('discord_username', usernameSchema);
