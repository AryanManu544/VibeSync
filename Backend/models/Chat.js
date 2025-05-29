const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  server_id: String,
  channels: [{
    channel_id: String,
    channel_name: String,
    chat_details: [{
      content: String,
      image: String,
      sender_id: String,
      sender_name: String,
      sender_pic: String,
      sender_tag: String,
      timestamp: String,
      edited: { type: Boolean, default: false }
    }]
  }]
});

module.exports = mongoose.model('discord_chats', chatSchema);