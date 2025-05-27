const path = require('path');
const DMChat = require('../models/DMChat');     
const Chat = require('../models/Chat');        

exports.uploadDmImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No image file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const { to } = req.body;

  const message = {
    senderId: req.user.id,
    senderName: req.user.username,
    senderPic: req.user.profile_pic,
    content: '',
    image: imageUrl,
    timestamp: Date.now(),
    edited: false
  };

  try {
    const participants = [req.user.id, to].sort(); 
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
    res.status(200).json({ imageUrl });
  } catch (err) {
    console.error('Error saving DM image message:', err);
    res.status(500).json({ msg: 'Server error saving DM image' });
  }
};

exports.uploadChannelImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No image file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const { server_id, channel_id } = req.body;

  try {
    res.status(200).json({ imageUrl });
  } catch (err) {
    console.error('Error uploading channel image:', err);
    res.status(500).json({ msg: 'Server error uploading channel image' });
  }
};

exports.storeChannelImageMessage = async (req, res) => {
  const {
    server_id, channel_id, channel_name,
    message, image, username, tag, id,
    profile_pic, timestamp
  } = req.body;

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
    res.status(500).json({ msg: 'Server error storing image message' });
  }
};

exports.storeDMImageMessage = async (req, res) => {
  try {
    const { to, imageUrl, timestamp } = req.body;
    const userId = req.user.id;
    const userName = req.user.username;
    const profilePic = req.user.profile_pic;

    const participants = [userId, to].sort();

    let dmChat = await DMChat.findOne({ participants });

    const message = {
      senderId: userId,
      senderName: userName,
      senderPic: profilePic,
      content: '',
      image: imageUrl,
      timestamp,
      edited: false
    };

    if (!dmChat) {
      dmChat = new DMChat({
        participants,
        messages: [message]
      });
    } else {
      dmChat.messages.push(message);
    }

    await dmChat.save();
    res.json({ status: 200, message: 'DM image message stored' });
  } catch (err) {
    console.error('Error storing DM image message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
