const Chat = require('../models/Chat');
const User = require('../models/User');

exports.storeMessage = async (req, res) => {
  const {
    message,
    server_id,
    channel_id,
    channel_name,
    timestamp,
    username,
    tag,
    id,
  } = req.body;

  try {
    const actualUser = await User.findById(id).select('profile_pic');
    const avatarToStore = (actualUser && actualUser.profile_pic)
      ? actualUser.profile_pic
      : process.env.DEFAULT_PROFILE_PIC;  

    const existing = await Chat.find({ server_id, 'channels.channel_id': channel_id });

    if (existing.length === 0) {
      await Chat.updateOne(
        { server_id },
        {
          $push: {
            channels: [
              {
                channel_id,
                channel_name,
                chat_details: [
                  {
                    content: message,
                    sender_id: id,
                    sender_name: username,
                    sender_pic: avatarToStore,
                    sender_tag: tag,
                    timestamp: timestamp.toString()
                  }
                ]
              }
            ]
          }
        },
        { upsert: true } 
      );
    } else {
      await Chat.updateOne(
        { 'channels.channel_id': channel_id, server_id },
        {
          $push: {
            'channels.$.chat_details': {
              content: message,
              sender_id: id,
              sender_name: username,
              sender_pic: avatarToStore,
              sender_tag: tag,
              timestamp: timestamp.toString()
            }
          }
        }
      );
    }

    return res.status(200).json({ status: 200, message: 'Message stored successfully' });
  } catch (err) {
    console.error('Error storing message:', err);
    return res.status(500).json({
      status: 500,
      message: 'Server error while storing message'
    });
  }
};


exports.storeImageMessage = async (req, res) => {
  const {
    image, 
    server_id,
    channel_id,
    channel_name,
    timestamp,
    username,
    tag,
    id,         
  } = req.body;

  try {
    const actualUser = await User.findById(id).select('profile_pic');
    const avatarToStore = (actualUser && actualUser.profile_pic)
      ? actualUser.profile_pic
      : process.env.DEFAULT_PROFILE_PIC;

    const existing = await Chat.find({ server_id, 'channels.channel_id': channel_id });
    if (existing.length === 0) {
      await Chat.updateOne(
        { server_id },
        {
          $push: {
            channels: [
              {
                channel_id,
                channel_name,
                chat_details: [
                  {
                    image: image,
                    sender_id: id,
                    sender_name: username,
                    sender_pic: avatarToStore,
                    sender_tag: tag,
                    timestamp: timestamp.toString()
                  }
                ]
              }
            ]
          }
        },
        { upsert: true }
      );
    } else {
      await Chat.updateOne(
        { 'channels.channel_id': channel_id, server_id },
        {
          $push: {
            'channels.$.chat_details': {
              image: image,
              sender_id: id,
              sender_name: username,
              sender_pic: avatarToStore,
              sender_tag: tag,
              timestamp: timestamp.toString()
            }
          }
        }
      );
    }

    return res
      .status(200)
      .json({ status: 200, message: 'Image message stored successfully' });
  } catch (err) {
    console.error('Error storing image message:', err);
    return res.status(500).json({
      status: 500,
      message: 'Server error while storing image message'
    });
  }
};

exports.getMessages = async (req, res) => {
  const { server_id, channel_id } = req.body;
  try { 
    const data = await Chat.aggregate([
      { $match: { server_id } },
      {
        $project: {
          _id: 0, 
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

    if (!data || data.length === 0 || !data[0].channels || data[0].channels.length === 0) {
      return res.status(200).json({ status: 200, chats: [] }); 
    }
    const chatDetails = data[0].channels[0].chat_details.map(chat => ({
        ...chat,
        timestamp: Number(chat.timestamp)
    }));

    return res.status(200).json({ status: 200, chats: chatDetails });
  } catch (err) {
    console.error('Error getting messages:', err);
    return res.status(500).json({ status: 500, message: 'Server error while fetching messages' });
  }
};

exports.delete_message = async (req, res) => {
  const { channel_id, timestamp } = req.body;
  const userId = req.userId; 

  try {
    const result = await Chat.findOneAndUpdate(
      {
        'channels.channel_id': channel_id
      },
      {
        $pull: {
          'channels.$[channel].chat_details': {
            timestamp: Number(timestamp), 
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
      console.log('❌ Delete failed - Channel not found or server document mismatch');
      return res.status(404).json({ status: 404, message: 'Channel not found' });
    }
    
    console.log('✅ Delete operation attempted/successful on server.');
    return res.status(200).json({ status: 200, message: 'Message delete operation processed' });
  } catch (err) {
    console.error('❌ Error deleting message:', err);
    return res.status(500).json({ status: 500, message: 'Server error during delete' });
  }
};

exports.edit_message = async (req, res) => {
  const { channel_id, timestamp, newContent } = req.body;
  const userId = req.userId; 

  try {
    const numericTimestamp = Number(timestamp);

    const result = await Chat.findOneAndUpdate(
      {
        'channels.channel_id': channel_id,
        'channels.chat_details': { $elemMatch: { timestamp: numericTimestamp, sender_id: userId } }
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
          { 'chat.timestamp': numericTimestamp, 'chat.sender_id': userId }
        ],
        new: true 
      }
    );

    if (!result) {
      console.log('❌ Edit failed - Message not found or not authorized');
      return res.status(404).json({ status: 404, message: 'Message not found or not authorized' });
    }
    
    const channelData = result.channels.find(c => c.channel_id === channel_id);
    const editedMessage = channelData ? channelData.chat_details.find(m => m.timestamp === numericTimestamp && m.sender_id === userId) : null;

    if (!editedMessage || editedMessage.content !== newContent) {
        console.log('❌ Edit failed - Update did not apply as expected, or message not found after update attempt.');
        return res.status(404).json({ status: 404, message: 'Failed to apply edit or message disappeared.' });
    }


    console.log('✅ Edit successful on server.');
    return res.status(200).json({ status: 200, message: 'Message edited successfully' });
  } catch (err) {
    console.error('❌ Error editing message:', err);
    return res.status(500).json({ status: 500, message: 'Server error during edit' });
  }
};