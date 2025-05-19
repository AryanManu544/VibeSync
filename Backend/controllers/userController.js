const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
