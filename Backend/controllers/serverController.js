const mongoose = require('mongoose');
const Server   = require('../models/Server');
const Chat     = require('../models/Chat');
const User     = require('../models/User');

// controllers/serverController.js
exports.createServer = async (req, res) => {
  const { server_details: rawDetails } = req.body;
  const file   = req.file;
  const userId = req.userId;

  // 1) Parse JSON
  let details;
  try {
    details = JSON.parse(rawDetails);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid JSON in server_details' });
  }
  const { name, type, key, role } = details;
  if (!name || !type || !key || !role) {
    return res.status(400).json({ message: 'Missing required server fields' });
  }

  // 2) Fetch the user record
  let userData;
  try {
    userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error loading user' });
  }

  // 3) Build image data-URL if provided
  let picDataUrl = '';
  if (file) {
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Uploaded file is not an image' });
    }
    const b64 = file.buffer.toString('base64');
    picDataUrl = `data:${file.mimetype};base64,${b64}`;
  }

  try {
    // 4) Create the server document
    const serverDoc = new Server({
      server_name: name,
      server_pic: picDataUrl,
      users: [
        {
          user_id:          userData._id.toString(),
          user_name:        userData.username,       // <- real username
          user_profile_pic: userData.profile_pic,    // <- real profile picture URL/data
          user_tag:         userData.tag,            // <- real tag
          user_role:        role
        }
      ],
      categories: [],
      active:     true
    });
    await serverDoc.save();

    // 5) Create chat doc
    const chatDoc = new Chat({ server_id: serverDoc._id });
    await chatDoc.save();

    // 6) Push summary to the user's server list
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          servers: {
            server_id:   serverDoc._id.toString(),
            server_name: serverDoc.server_name,
            server_pic:  serverDoc.server_pic,
            server_role: role
          }
        }
      }
    );

    return res.status(201).json({
      message:   'Server created',
      server_id: serverDoc._id.toString()
    });

  } catch (err) {
    console.error('❌ createServer error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getServerInfo = async (req, res) => {
  const { server_id } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(server_id)) {
    return res.status(400).json({ message: 'Invalid server ID' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const allowed = user.servers.some(s => s.server_id === server_id);
    if (!allowed) return res.status(403).json({ message: 'Unauthorized' });

    const server = await Server.findById(server_id);
    if (!server) return res.status(404).json({ message: 'Server not found' });

    return res.status(200).json(server);
  } catch (err) {
    console.error('❌ getServerInfo error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addCategory = async (req, res) => {
  const { category_name, server_id } = req.body;
  if (!category_name || !mongoose.Types.ObjectId.isValid(server_id)) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    const result = await Server.updateOne(
      { _id: server_id },
      { $push: { categories: { category_name, channels: [] } } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({ message: 'Server not found' });
    }
    return res.status(200).json({ message: 'Category added' });
  } catch (err) {
    console.error('❌ addCategory error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addChannel = async (req, res) => {
  const { category_id, channel_name, channel_type, server_id } = req.body;
  if (
    !channel_name ||
    !channel_type ||
    !mongoose.Types.ObjectId.isValid(server_id) ||
    !mongoose.Types.ObjectId.isValid(category_id)
  ) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    const result = await Server.updateOne(
      { _id: server_id, 'categories._id': category_id },
      { $push: { 'categories.$.channels': { channel_name, channel_type } } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json({ message: 'Channel added' });
  } catch (err) {
    console.error('❌ addChannel error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};