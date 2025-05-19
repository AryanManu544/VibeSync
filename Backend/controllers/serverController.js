const Server = require('../models/Server');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { createServerTemplate } = require('../utils/helpers');
const mongoose = require('mongoose');

exports.createServer = async (req, res) => {
  const { server_details} = req.body;
  const server_image = req.file;
  try {
  server_details = JSON.parse(server_details);
} catch (err) {
  return res.status(400).json({ message: 'Invalid JSON in server_details' });
}
const { name, type, key, role } = server_details || {};

  const userId = req.userId;

  if (!name || !type || !key || !role || !userId) {
    return res.status(400).json({ message: 'Invalid server details' });
  }

  try {
    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const template = await createServerTemplate(userData, server_details, server_image);

    const chatDoc = new Chat({ server_id: template._id });
    await chatDoc.save();

    const serverInfo = {
      server_name: template.server_name,
      server_pic: template.server_pic,
      server_id: template._id.toString(),
      server_role: role
    };

    await User.updateOne(
      { _id: userId },
      { $push: { servers: serverInfo } }
    );

    res.status(200).json({ message: 'Server Created' });

  } catch (err) {
    console.error('❌ createServer error:', err);
    res.status(500).json({ message: 'Internal server error' });
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
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPartOfServer = user.servers.some(s => s.server_id === server_id);
    if (!isPartOfServer) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const server = await Server.findById(server_id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    res.status(200).json(server);

  } catch (err) {
    console.error('❌ getServerInfo error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.addCategory = async (req, res) => {
  const { category_name, server_id } = req.body;

  if (!category_name || !mongoose.Types.ObjectId.isValid(server_id)) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  try {
    const result = await Server.updateOne(
      { _id: server_id },
      { $push: { categories: { category_name, channels: [] } } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Category added' });
    } else {
      res.status(404).json({ message: 'Server not found' });
    }

  } catch (err) {
    console.error('❌ addCategory error:', err);
    res.status(500).json({ message: 'Internal server error' });
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
    return res.status(400).json({ message: 'Invalid input data' });
  }

  try {
    const result = await Server.updateOne(
      {
        _id: server_id,
        'categories._id': category_id
      },
      {
        $push: {
          'categories.$.channels': {
            channel_name,
            channel_type
          }
        }
      }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Channel added' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }

  } catch (err) {
    console.error('❌ addChannel error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};