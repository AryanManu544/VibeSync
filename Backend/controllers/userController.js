// controllers/userController.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const Chat   = require('../models/Chat');     
const { isUsernameAvailable } = require('../utils/helpers');

// Fetch incoming/outgoing friend requests, friends list, and servers
exports.getUserRelations = async (req, res) => {
  try {
    const userData = await User.findById(req.userId);
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { incoming_reqs, outgoing_reqs, friends, servers } = userData;
    return res.status(200).json({ incoming_reqs, outgoing_reqs, friends, servers });
  } catch (err) {
    console.error('❌ getUserRelations error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Fetch a single user's public info by ID
exports.getUserById = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ status: 400, message: 'Missing ID' });
  }

  try {
    const userData = await User.findById(id, 'username profile_pic tag');
    if (!userData) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id:           userData._id,
        name:         userData.username,
        profile_pic:  userData.profile_pic,
        tag:          userData.tag
      }
    });
  } catch (err) {
    console.error('❌ getUserById error:', err);
    return res.status(500).json({ status: 500, message: 'Server error' });
  }
};

// Update Profile Picture
exports.update_picture = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // req.file.path is automatically set by multer-storage-cloudinary
    const imageUrl = req.file.path;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { profile_pic: imageUrl },
      { new: true }
    );

    return res.status(200).json({ message: 'Profile picture updated', profile_pic: updatedUser.profile_pic });

  } catch (err) {
    console.error('❌ update_picture error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update Username (and backfill chat messages)
exports.update_name = async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Invalid name' });
  }

  try {
    // 1) Update the user’s own document
    const user = await User.findByIdAndUpdate(
      req.userId,
      { username: name.trim() },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2) Backfill all embedded chat messages
    await Chat.updateMany(
      { 'messages.user_id': req.userId },
      {
        $set: {
          'messages.$[msg].user_name': user.username
        }
      },
      {
        arrayFilters: [{ 'msg.user_id': user._id }],
        multi: true
      }
    );

    return res.status(200).json({ message: 'Name updated' });
  } catch (err) {
    console.error('❌ update_name error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update Email Address
exports.update_email = async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  try {
    // Ensure uniqueness
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing && existing._id.toString() !== req.userId) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    await User.findByIdAndUpdate(
      req.userId,
      { email: email.trim().toLowerCase() },
      { new: true }
    );

    return res.status(200).json({ message: 'Email updated' });
  } catch (err) {
    console.error('❌ update_email error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update Password
exports.update_password = async (req, res) => {
  const { currentPwd, newPwd } = req.body;
  if (
    !currentPwd ||
    !newPwd ||
    typeof currentPwd !== 'string' ||
    typeof newPwd !== 'string' ||
    newPwd.length < 7
  ) {
    return res.status(400).json({ message: 'Invalid password input' });
  }

  try {
    // Fetch user with hashed password
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPwd, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash and store new password
    const hashed = await bcrypt.hash(newPwd, 12);
    await User.findByIdAndUpdate(
      req.userId,
      { password: hashed },
      { new: true }
    );

    return res.status(200).json({ message: 'Password changed' });
  } catch (err) {
    console.error('❌ update_password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};