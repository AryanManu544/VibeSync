const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  server_name: String,
  server_pic: String,
  roles: [{
    name: String,
    color: String,
    permissions: [String],
    id: String 
  }],
  users: [{
    user_name: String,
    user_profile_pic: String,
    user_tag: String,
    user_id: String,
    role_ids: [String] 
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
