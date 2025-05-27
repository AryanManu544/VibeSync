const path = require('path');
const DMChat = require('../models/DMChat');
const Chat = require('../models/Chat');

exports.uploadChannelImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 400, msg: 'No image file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const { server_id, channel_id } = req.body;

  try {
    // No need to store in DB here — only return the URL for frontend use
    res.status(200).json({ status: 200, imageUrl });
  } catch (err) {
    console.error('Error uploading channel image:', err);
    res.status(500).json({ status: 500, msg: 'Server error uploading channel image' });
  }
};

exports.storeChannelImageMessage = async (req, res) => {
  const {
    server_id, channel_id, channel_name,
    message, image, username, tag, id,
    profile_pic, timestamp
  } = req.body;

  if (!image) {
    return res.status(400).json({ status: 400, msg: 'Image URL is required' });
  }

  const msg = {
    content: message || '',
    image,
    sender_id: id,
    sender_name: username,
    sender_tag: tag,
    sender_pic: profile_pic,
    timestamp
  };

  try {
    let serverChat = await Chat.findOne({ server_id });

    if (!serverChat) {
      serverChat = new Chat({
        server_id,
        channels: [{
          channel_id,
          channel_name,
          chat_details: [msg]
        }]
      });
    } else {
      const channel = serverChat.channels.find(ch => ch.channel_id === channel_id);
      if (channel) {
        channel.chat_details.push(msg);
      } else {
        serverChat.channels.push({
          channel_id,
          channel_name,
          chat_details: [msg]
        });
      }
    }

    await serverChat.save();
    res.status(200).json({ status: 200, msg: 'Image message stored' });
  } catch (err) {
    console.error('Error storing channel image message:', err);
    res.status(500).json({ status: 500, msg: 'Server error storing image message' });
  }
};

exports.storeDMImageMessage = async (req, res) => {
  try {
    const { to, imageUrl, timestamp } = req.body;

    if (!imageUrl || !to || !timestamp) {
      return res.status(400).json({ status: 400, msg: 'Missing required fields (imageUrl, to, timestamp)' });
    }

    const userId = req.user.id;
    const userName = req.user.username;
    const profilePic = req.user.profile_pic;

    const participants = [userId, to].sort();

    const message = {
      senderId: userId,
      senderName: userName,
      senderPic: profilePic,
      content: '',
      image: imageUrl,
      timestamp,
      edited: false
    };

    let dmChat = await DMChat.findOne({ participants });

    if (!dmChat) {
      dmChat = new DMChat({
        participants,
        messages: [message]
      });
    } else {
      dmChat.messages.push(message);
    }

    await dmChat.save();
    res.status(200).json({ status: 200, message: 'DM image message stored' });
  } catch (err) {
    console.error('Error storing DM image message:', err);
    res.status(500).json({ status: 500, error: 'Internal server error' });
  }
};