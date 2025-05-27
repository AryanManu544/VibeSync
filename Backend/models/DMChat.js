const mongoose = require('mongoose');

const dmChatSchema = new mongoose.Schema({
  participants: {
    type: [String],
    validate: arr => arr.length === 2
  },
  messages: [{
    senderId: String,
    senderName: String,
    senderPic: String,
    content: String,
    timestamp: Number,
    edited: Boolean,
  }]
}, { timestamps: true });

module.exports = mongoose.model('discord_dmchats', dmChatSchema);
