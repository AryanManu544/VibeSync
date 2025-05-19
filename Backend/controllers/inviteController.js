const Invite = require('../models/Invite');
const User = require('../models/User');
const shortid = require('shortid');

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
