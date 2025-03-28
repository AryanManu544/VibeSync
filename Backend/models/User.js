const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    avatar: {
      type: String,
      default: 'default-avatar.png'
    },
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    servers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server'
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    resetToken: String,
    resetTokenExpiration: Date,
  }, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);