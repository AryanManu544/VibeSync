const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  server_name: String,
  server_pic: String,
  users: [{
    user_name: String,
    user_profile_pic: String,
    user_tag: String,
    user_id: String,
    user_role: String
  }],
  categories: [{
    category_name: String,
    channels: [{
      channel_name: String,
      channel_type: String
    }]
  }],
  active: Boolean 
});

module.exports = mongoose.model('discord_server', serverSchema);
