const Chat = require('../models/Chat');

exports.storeMessage = async (req, res) => {
  const { message, server_id, channel_id, channel_name, timestamp, username, tag, id, profile_pic } = req.body;

  const existing = await Chat.find({ server_id, 'channels.channel_id': channel_id });

  if (existing.length === 0) {
    const result = await Chat.updateOne(
      { server_id },
      {
        $push: {
          channels: [{
            channel_id,
            channel_name,
            chat_details: [{
              content: message,
              sender_id: id,
              sender_name: username,
              sender_pic: profile_pic,
              sender_tag: tag,
              timestamp
            }]
          }]
        }
      }
    );
    return res.json({ status: 200 });
  }

  const result = await Chat.updateOne(
    { 'channels.channel_id': channel_id },
    {
      $push: {
        'channels.$.chat_details': {
          content: message,
          sender_id: id,
          sender_name: username,
          sender_pic: profile_pic,
          sender_tag: tag,
          timestamp
        }
      }
    }
  );
  return res.json({ status: 200 });
};

exports.getMessages = async (req, res) => {
  const { server_id, channel_id } = req.body;
  const data = await Chat.aggregate([
    { $match: { server_id } },
    {
      $project: {
        channels: {
          $filter: {
            input: '$channels',
            as: 'channel',
            cond: { $eq: ['$$channel.channel_id', channel_id] }
          }
        }
      }
    }
  ]);

  if (!data[0]?.channels?.length) {
    return res.json({ chats: [] });
  }

  return res.json({ chats: data[0].channels[0].chat_details });
};
