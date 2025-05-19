const Server = require('../models/Server');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { createServerTemplate } = require('../utils/helpers');

exports.createServer = async (req, res) => {
  const { name, type, key, role } = req.body.server_details;
  const user = req.userId;
  const image = req.body.server_image;

  try {
    const userData = await User.findById(user);
    const template = await createServerTemplate(userData, req.body.server_details, image);

    const chatDoc = new Chat({ server_id: template._id });
    await chatDoc.save();

    const serverInfo = {
      server_name: template.server_name,
      server_pic: template.server_pic,
      server_id: template._id.toString()
    };

    await User.updateOne(
      { _id: user },
      {
        $push: {
          servers: {
            ...serverInfo,
            server_role: role
          }
        }
      }
    );

    res.json({ status: 200, message: 'Server Created' });

  } catch (err) {
    console.error('❌ createServer error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getServerInfo = async (req, res) => {
  const { server_id } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    const isPartOfServer = user.servers.some(s => s.server_id === server_id);

    if (!isPartOfServer)
      return res.status(403).json({ message: 'Unauthorized' });

    const server = await Server.findById(server_id);
    res.json(server);

  } catch (err) {
    console.error('❌ getServerInfo error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addCategory = async (req, res) => {
  const { category_name, server_id } = req.body;

  try {
    const result = await Server.updateOne(
      { _id: server_id },
      { $push: { categories: { category_name, channels: [] } } }
    );

    if (result.modifiedCount > 0)
      res.json({ status: 200 });
    else
      res.status(404).json({ status: 404, message: 'Server not found' });

  } catch (err) {
    console.error('❌ addCategory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addChannel = async (req, res) => {
  const { category_id, channel_name, channel_type, server_id } = req.body;

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

    if (result.modifiedCount > 0)
      res.json({ status: 200 });
    else
      res.status(404).json({ status: 404, message: 'Category not found' });

  } catch (err) {
    console.error('❌ addChannel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
