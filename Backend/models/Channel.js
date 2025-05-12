const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text'
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      required: true
    },
    messages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }]
  }, { timestamps: true });

module.exports = mongoose.model('Channel', ChannelSchema);