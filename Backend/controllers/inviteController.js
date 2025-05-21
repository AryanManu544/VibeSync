const Invite = require('../models/Invite');
const User = require('../models/User');
const shortid = require('shortid');
const Server = require('../models/Server');  
const mongoose = require('mongoose');

exports.createInvite = async (req, res) => {
  const { inviter_name, inviter_id, server_name, server_id, server_pic } = req.body;

  const existing = await User.aggregate([
    { $match: { _id: inviter_id } },
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
    return res.json({ status: 200, invite_code: existing[0].invites[0].invite_code });
  }

  const timestamp = Date.now();
  const invite_code = shortid();

  await new Invite({
    invite_code,
    inviter_name,
    inviter_id,
    server_name,
    server_id,
    server_pic,
    timestamp
  }).save();

  await User.updateOne(
    { _id: inviter_id },
    {
      $push: {
        invites: { server_id, invite_code, timestamp }
      }
    }
  );

  return res.json({ status: 200, invite_code });
};

exports.getInviteInfo = async (req, res) => {
  const { invite_link } = req.body;
  const data = await Invite.findOne({ invite_code: invite_link });

  if (!data) return res.status(404).json({ status: 404 });

  const { inviter_name, server_name, server_pic, server_id, inviter_id } = data;
  return res.json({ status: 200, inviter_name, server_name, server_pic, server_id, inviter_id });
};

exports.acceptInvite = async (req, res) => {
  const { invite_code } = req.body;
  const userId = req.userId;                // from your auth middleware

  const invite = await Invite.findOne({ invite_code });
  if (!invite) {
    return res.status(404).json({ status: 404, message: 'Invite not found' });
  }

  const alreadyMember = await Server.exists({
    _id: invite.server_id,
    'users.user_id': userId
  });
  if (alreadyMember) {
    return res.status(400).json({ status: 400, message: 'Already a member' });
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }

  await Server.updateOne(
    { _id: invite.server_id },
    {
      $push: {
        users: {
          user_id:          user._id.toString(),
          user_name:        user.username,
          user_profile_pic: user.profile_pic,
          user_tag:         user.tag,
          user_role:        'member'    
        }
      }
    }
  );

  await User.updateOne(
    { _id: userId },
    {
      $push: {
        servers: {
          server_id:   invite.server_id,
          server_name: invite.server_name,
          server_pic:  invite.server_pic,
          server_role: 'member'
        }
      }
    }
  );

  return res.json({ status: 200, message: 'Joined server successfully' });
};