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

exports.delete_message = async (req, res) => {
  const { channel_id, timestamp } = req.body;
  const userId = req.userId;

  console.log('DELETE DEBUG ->', { userId, channel_id, timestamp });

  try {
    const result = await Chat.findOneAndUpdate(
      {
        'channels.channel_id': channel_id
      },
      {
        $pull: {
          'channels.$[channel].chat_details': {
            timestamp,
            sender_id: userId
          }
        }
      },
      {
        arrayFilters: [
          { 'channel.channel_id': channel_id }
        ],
        new: true
      }
    );

    if (!result) {
      console.log('❌ Delete failed - no match');
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    console.log('✅ Delete successful');
    return res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting message:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.edit_message = async (req, res) => {
  const { channel_id, timestamp, newContent } = req.body;
  const userId = req.userId;

  console.log('EDIT DEBUG ->', { userId, channel_id, timestamp, newContent });

  try {
    const result = await Chat.findOneAndUpdate(
      {
        'channels.channel_id': channel_id,
        'channels.chat_details.timestamp': timestamp,
        'channels.chat_details.sender_id': userId
      },
      {
        $set: {
          'channels.$[channel].chat_details.$[chat].content': newContent,
          'channels.$[channel].chat_details.$[chat].edited': true
        }
      },
      {
        arrayFilters: [
          { 'channel.channel_id': channel_id },
          { 'chat.timestamp': timestamp, 'chat.sender_id': userId }
        ],
        new: true
      }
    );

    if (!result) {
      console.log('❌ Edit failed - no match');
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    console.log('✅ Edit successful');
    return res.status(200).json({ message: 'Message edited successfully' });
  } catch (err) {
    console.error('❌ Error editing message:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};