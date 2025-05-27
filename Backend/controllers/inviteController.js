const Invite = require('../models/Invite');
const User = require('../models/User');
const shortid = require('shortid');
const Server = require('../models/Server');  
const mongoose = require('mongoose');

exports.createInvite = async (req, res) => {
  try {
    const { inviter_name, inviter_id, server_name, server_id, server_pic } = req.body;
    
    if (!inviter_name || !inviter_id || !server_name || !server_id) {
      return res.status(400).json({ 
        status: 400, 
        message: 'Missing required fields' 
      });
    }

    const serverObjectId = mongoose.Types.ObjectId.isValid(server_id) 
      ? new mongoose.Types.ObjectId(server_id) 
      : server_id;
    
    const inviterObjectId = mongoose.Types.ObjectId.isValid(inviter_id) 
      ? new mongoose.Types.ObjectId(inviter_id) 
      : inviter_id;

    const existing = await User.aggregate([
      { $match: { _id: inviterObjectId } },
      {
        $project: {
          invites: {
            $filter: {
              input: '$invites',
              as: 'invite',
              cond: { $eq: ['$$invite.server_id', server_id] }
            }
          }
        }
      }
    ]);

    if (existing[0]?.invites?.length > 0) {
      return res.json({ 
        status: 200, 
        invite_code: existing[0].invites[0].invite_code 
      });
    }

    const timestamp = Date.now();
    const invite_code = shortid.generate(); 

    await new Invite({
      invite_code,
      inviter_name,
      inviter_id: inviterObjectId,
      server_name,
      server_id: serverObjectId,
      server_pic,
      timestamp
    }).save();

    await User.updateOne(
      { _id: inviterObjectId },
      {
        $push: {
          invites: { server_id: server_id, invite_code, timestamp }
        }
      }
    );

    return res.json({ status: 200, invite_code });

  } catch (error) {
    console.error('Error creating invite:', error);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

exports.getInviteInfo = async (req, res) => {
  try {
    const { invite_link } = req.body;
    
    if (!invite_link) {
      return res.status(400).json({ 
        status: 400, 
        message: 'Invite link is required' 
      });
    }

    const data = await Invite.findOne({ invite_code: invite_link });

    if (!data) {
      return res.status(404).json({ 
        status: 404, 
        message: 'Invite not found' 
      });
    }

    const { inviter_name, server_name, server_pic, server_id, inviter_id } = data;
    return res.json({ 
      status: 200, 
      inviter_name, 
      server_name, 
      server_pic, 
      server_id, 
      inviter_id 
    });

  } catch (error) {
    console.error('Error getting invite info:', error);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const { invite_code } = req.body;
    const userId = req.userId; 

    if (!invite_code) {
      return res.status(400).json({ 
        status: 400, 
        message: 'Invite code is required' 
      });
    }

    const invite = await Invite.findOne({ invite_code });
    if (!invite) {
      return res.status(404).json({ 
        status: 404, 
        message: 'Invite not found' 
      });
    }

    const alreadyMember = await Server.exists({
      _id: invite.server_id,
      'users.user_id': userId
    });
    
    if (alreadyMember) {
      return res.status(400).json({ 
        status: 400, 
        message: 'Already a member of this server' 
      });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ 
        status: 404, 
        message: 'User not found' 
      });
    }

    await Server.updateOne(
      { _id: invite.server_id },
      {
        $push: {
          users: {
            user_id: user._id.toString(),
            user_name: user.username,
            user_profile_pic: user.profile_pic,
            user_tag: user.tag,
            user_role: 'member'    
          }
        }
      }
    );

    await User.updateOne(
      { _id: userId },
      {
        $push: {
          servers: {
            server_id: invite.server_id,
            server_name: invite.server_name,
            server_pic: invite.server_pic,
            server_role: 'member'
          }
        }
      }
    );

    return res.json({ 
      status: 200, 
      message: 'Successfully joined server',
      server_id: invite.server_id 
    });

  } catch (error) {
    console.error('Error accepting invite:', error);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};