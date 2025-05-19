const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  tag: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: String,
  profile_pic: String,
  servers: [{
    server_name: String,
    server_pic: String,
    server_role: String,
    server_id: String
  }],
  incoming_reqs: [{
    id: String,
    username: String,
    profile_pic: String,
    tag: String,
    status: String
  }],
  outgoing_reqs: [{
    id: String,
    username: String,
    profile_pic: String,
    tag: String,
    status: String
  }],
  friends: [{
    id: String,
    username: String,
    profile_pic: String,
    tag: String
  }],
  blocked: [{
    id: String,
    username: String,
    profile_pic: String,
    tag: String
  }],
  invites: [{
    server_id: String,
    invite_code: String,
    timestamp: String
  }],
  dms: [{
    userId: String,
    name: String,
    tag: String,
    profile_pic: String
  }]
});
userSchema.index({ username: 1, tag: 1 }, { unique: true });

module.exports = mongoose.model('discord_user', userSchema);
