const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.getUserRelations = async (req, res) => {
  try {
    const userData = await User.findById(req.userId);
    if (!userData) return res.status(404).json({ message: 'User not found' });

    const { incoming_reqs, outgoing_reqs, friends, servers } = userData;
    res.status(200).json({ incoming_reqs, outgoing_reqs, friends, servers });

  } catch (err) {
    console.error('❌ getUserRelations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ status: 400, message: 'Missing ID' });

  try {
    const userData = await User.findById(id, 'username profile_pic tag');
    if (!userData) return res.status(404).json({ status: 404, message: 'User not found' });

    return res.status(200).json({
      user: {
        id: userData._id,
        name: userData.username,
        profile_pic: userData.profile_pic,
        tag: userData.tag
      }
    });
  } catch (err) {
    console.error('❌ getUserById error:', err);
    return res.status(500).json({ status: 500, message: 'Server error' });
  }
};

exports.update_picture = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to Base64 data URL
    const mime = req.file.mimetype; // e.g. 'image/jpeg'
    const b64  = req.file.buffer.toString('base64');
    const dataUrl = `data:${mime};base64,${b64}`;

    await User.findByIdAndUpdate(
      req.userId,
      { profile_pic: dataUrl },
      { new: true }
    );

    return res.status(200).json({ message: 'Profile picture updated', profile_pic: dataUrl });
  } catch (err) {
    console.error('❌ update_picture error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.update_name = async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Invalid name' });
  }

  try {
    await User.findByIdAndUpdate(
      req.userId,
      { username: name.trim() },
      { new: true }
    );
    return res.status(200).json({ message: 'Name updated' });
  } catch (err) {
    console.error('❌ update_name error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.update_email = async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  try {
    // Check if email already in use
    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists && exists._id.toString() !== req.userId) {
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
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const match = await bcrypt.compare(currentPwd, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

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