const mongoose = require('mongoose');
const Server   = require('../models/Server');
const Chat     = require('../models/Chat');
const User     = require('../models/User');

exports.createServer = async (req, res) => {
  const { server_details: rawDetails } = req.body;
  const file  = req.file;       // multer puts the uploaded file here
  const userId = req.userId;    // from your auth middleware

  // 1) Parse and validate details
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

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  // 2) Build the image data-URL (or leave blank)
  let picDataUrl = '';
  if (file) {
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Uploaded file is not an image' });
    }
    const b64 = file.buffer.toString('base64');
    picDataUrl = `data:${file.mimetype};base64,${b64}`;
  }

  try {
    // 3) Create the server document
    const serverDoc = new Server({
      server_name: name,
      server_pic:  picDataUrl,
      users: [{
        user_id:        userId,
        user_name:      req.userName || 'Unknown',    // if you store the name in req
        user_profile_pic: req.userPic || '',          // likewise
        user_tag:       req.userTag || '',
        user_role:      role
      }],
      categories: [],    // start empty, use your addCategory route to seed
      active:     true
    });
    await serverDoc.save();

    // 4) Create the associated chat document
    const chatDoc = new Chat({ server_id: serverDoc._id });
    await chatDoc.save();

    // 5) Push summary onto the user
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

    return res.status(201).json({ message: 'Server created', server_id: serverDoc._id });
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