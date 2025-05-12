const mongoose = require("mongoose")

const ServerSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    channels: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    }],
    icon: {
      type: String,
      default: 'default-server-icon.png'
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }, { timestamps: true });

module.exports = mongoose.model('Server', ServerSchema);