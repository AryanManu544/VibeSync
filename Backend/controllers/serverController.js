const mongoose = require('mongoose');
const Server   = require('../models/Server');
const Chat     = require('../models/Chat');
const User     = require('../models/User');

exports.createServer = async (req, res) => {
  console.log('📥 createServer - Request body:', req.body);
  console.log('📥 createServer - File info:', req.file ? 'File present' : 'No file');
  console.log('📥 createServer - Cloudinary URL:', req.cloudinaryUrl);
  console.log('📥 createServer - User ID:', req.userId);

  const { server_details: rawDetails } = req.body;
  const userId = req.userId;   
  const cloudinaryUrl = req.cloudinaryUrl; 

  // Validate userId exists
  if (!userId) {
    console.error('❌ No userId found in request');
    return res.status(401).json({ 
      status: 401, 
      message: 'Unauthorized - No user ID' 
    });
  }

  // Validate server_details exists
  if (!rawDetails) {
    console.error('❌ No server_details in request body');
    return res.status(400).json({ 
      status: 400, 
      message: 'Missing server_details in request body' 
    });
  }

  let details;
  try {
    details = JSON.parse(rawDetails);
    console.log('✅ Parsed server details:', details);
  } catch (err) {
    console.error('❌ JSON parse error:', err.message);
    return res.status(400).json({ 
      status: 400, 
      message: 'Invalid JSON in server_details' 
    });
  }
  
  const { name, type, key, role } = details;
  if (!name || !type || !key || !role) {
    console.error('❌ Missing required fields:', { name, type, key, role });
    return res.status(400).json({ 
      status: 400, 
      message: 'Missing required server fields: name, type, key, role' 
    });
  }

  let userData;
  try {
    console.log('🔍 Looking for user with ID:', userId);
    userData = await User.findById(userId);
    if (!userData) {
      console.error('❌ User not found with ID:', userId);
      return res.status(404).json({ 
        status: 404, 
        message: 'User not found' 
      });
    }
    console.log('✅ User found:', userData.username);
  } catch (err) {
    console.error('❌ Error fetching user in createServer:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Database error while fetching user' 
    });
  }

  try {
    console.log('🏗️ Creating server document...');
    
    const serverDoc = new Server({
      server_name: name,
      server_pic: cloudinaryUrl || userData.profile_pic || '', // Use Cloudinary URL
      users: [
        {
          user_id: userData._id.toString(),
          user_name: userData.username,
          user_profile_pic: userData.profile_pic,
          user_tag: userData.tag,
          user_role: role
        }
      ],
      categories: [],
      active: true
    });
    
    console.log('💾 Saving server document...');
    await serverDoc.save();
    console.log('✅ Server saved with ID:', serverDoc._id);

    console.log('💬 Creating chat document...');
    const chatDoc = new Chat({ server_id: serverDoc._id });
    await chatDoc.save();
    console.log('✅ Chat document saved');

    console.log('👤 Updating user document...');
    const updateResult = await User.updateOne(
      { _id: userId },
      {
        $push: {
          servers: {
            server_id: serverDoc._id.toString(),
            server_name: serverDoc.server_name,
            server_pic: serverDoc.server_pic,
            server_role: role
          }
        }
      }
    );
    console.log('✅ User updated, modified count:', updateResult.modifiedCount);

    console.log('🎉 Server creation successful');
    return res.status(201).json({
      status: 201,
      message: 'Server created successfully',
      server_id: serverDoc._id.toString(),
      server_pic: serverDoc.server_pic
    });
  } catch (err) {
    console.error('❌ createServer database error:', err);
    console.error('❌ Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error during server creation',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getServerInfo = async (req, res) => {
  const { server_id } = req.body;
  const userId        = req.userId;

  // 1) Validate ID
  if (!mongoose.Types.ObjectId.isValid(server_id)) {
    return res.status(400).json({ message: 'Invalid server ID' });
  }

  try {
    // 2) Confirm the requester is a member
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMember = user.servers.some(s => s.server_id === server_id);
    if (!isMember) return res.status(403).json({ message: 'Unauthorized' });

    // 3) Fetch the raw server doc
    const server = await Server.findById(server_id).lean();
    if (!server) return res.status(404).json({ message: 'Server not found' });

    // 4) For each placeholder user, load real data
    server.users = await Promise.all(
      server.users.map(async (u) => {
        const real = await User.findById(u.user_id).lean();
        if (real) {
          return {
            ...u,
            user_name:        real.username,
            user_tag:         real.tag,
            user_profile_pic: real.profile_pic
          };
        }
        // if user was deleted, keep the placeholder
        return u;
      })
    );

    // 5) Send back the enriched server
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

exports.leaveServer = async (req, res) => {
  const { server_id } = req.body;
  const userId = req.userId;

  // Validate server ID
  if (!mongoose.Types.ObjectId.isValid(server_id)) {
    return res.status(400).json({ 
      status: 400, 
      message: 'Invalid server ID' 
    });
  }

  try {
    // Check if user is a member of the server
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        status: 404, 
        message: 'User not found' 
      });
    }

    const isMember = user.servers.some(s => s.server_id === server_id);
    if (!isMember) {
      return res.status(404).json({ 
        status: 404, 
        message: 'You are not a member of this server' 
      });
    }

    // Check if user is the owner/admin - prevent leaving if they're the only admin
    const server = await Server.findById(server_id);
    if (!server) {
      return res.status(404).json({ 
        status: 404, 
        message: 'Server not found' 
      });
    }

    const userInServer = server.users.find(u => u.user_id === userId);
    const adminCount = server.users.filter(u => u.user_role === 'admin' || u.user_role === 'owner').length;
    
    if ((userInServer.user_role === 'admin' || userInServer.user_role === 'owner') && adminCount === 1) {
      return res.status(400).json({ 
        status: 400,
        message: 'Cannot leave server. You are the only admin. Transfer ownership first.' 
      });
    }

    // Remove user from server's users array
    await Server.updateOne(
      { _id: server_id },
      { $pull: { users: { user_id: userId } } }
    );

    // Remove server from user's servers array
    await User.updateOne(
      { _id: userId },
      { $pull: { servers: { server_id: server_id } } }
    );

    return res.json({ 
      status: 200,
      message: 'Successfully left the server',
      server_id: server_id 
    });

  } catch (error) {
    console.error('❌ leaveServer error:', error);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error' 
    });
  }
};