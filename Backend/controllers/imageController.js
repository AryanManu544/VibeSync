const Chat = require('../models/Chat');
const DMChat = require('../models/DMChat');

// Store image message in server chat
const storeImageMessage = async (req, res) => {
  try {
    const { image, server_id, channel_id, channel_name, timestamp, username, tag, id, profile_pic } = req.body;

    if (!image || !server_id || !channel_id || !timestamp || !username || !id) {
      return res.status(400).json({
        status: 400,
        message: 'Missing required fields'
      });
    }

    // Find existing chat document for this server
    let chat = await Chat.findOne({ server_id });

    if (!chat) {
      // Create new chat document if it doesn't exist
      chat = new Chat({
        server_id,
        channels: [{
          channel_id,
          channel_name,
          chat_details: [{
            content: '', // Empty content for image messages
            image: image,
            sender_id: id,
            sender_name: username,
            sender_pic: profile_pic,
            sender_tag: tag,
            timestamp: timestamp.toString(),
          }]
        }]
      });
    } else {
      // Find existing channel or create new one
      const channelIndex = chat.channels.findIndex(ch => ch.channel_id === channel_id);
      
      if (channelIndex !== -1) {
        // Channel exists, add message to it
        chat.channels[channelIndex].chat_details.push({
          content: '', // Empty content for image messages
          image: image,
          sender_id: id,
          sender_name: username,
          sender_pic: profile_pic,
          sender_tag: tag,
          timestamp: timestamp.toString(),
        });
      } else {
        // Channel doesn't exist, create new channel with this message
        chat.channels.push({
          channel_id,
          channel_name,
          chat_details: [{
            content: '', // Empty content for image messages
            image: image,
            sender_id: id,
            sender_name: username,
            sender_pic: profile_pic,
            sender_tag: tag,
            timestamp: timestamp.toString(),
          }]
        });
      }
    }

    await chat.save();

    res.status(200).json({
      status: 200,
      message: 'Image message stored successfully'
    });

  } catch (error) {
    console.error('Error storing image message:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
};

// Store image message in DM chat
const storeDMImage = async (req, res) => {
  try {
    const { to, senderName, senderPic, image, timestamp } = req.body;
    const senderId = req.userId;

    if (!to || !senderName || !image || !timestamp) {
      return res.status(400).json({
        status: 400,
        message: 'Missing required fields'
      });
    }

    // Create participants array (sorted to ensure consistency)
    const participants = [senderId, to].sort();

    // Find existing DM chat or create new one
    let dmChat = await DMChat.findOne({ participants });

    if (!dmChat) {
      dmChat = new DMChat({
        participants,
        messages: []
      });
    }

    // Add the image message
    dmChat.messages.push({
      senderId,
      senderName,
      senderPic,
      content: '', // Empty content for image messages
      image: image,
      timestamp: parseInt(timestamp),
      edited: false
    });

    await dmChat.save();

    res.status(200).json({
      status: 200,
      message: 'DM image stored successfully'
    });

  } catch (error) {
    console.error('Error storing DM image:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
};

// Get chat messages with images (modified to include image field)
const getMessages = async (req, res) => {
  try {
    const { channel_id, server_id } = req.body;

    if (!channel_id || !server_id) {
      return res.status(400).json({
        status: 400,
        message: 'Missing channel_id or server_id'
      });
    }

    const chat = await Chat.findOne({ server_id });

    if (!chat) {
      return res.status(200).json({
        status: 200,
        chats: []
      });
    }

    const channel = chat.channels.find(ch => ch.channel_id === channel_id);

    if (!channel) {
      return res.status(200).json({
        status: 200,
        chats: []
      });
    }

    // Transform the messages to include image field
    const messages = channel.chat_details.map(msg => ({
      content: msg.content || '',
      image: msg.image || null,
      sender_id: msg.sender_id,
      sender_name: msg.sender_name,
      sender_pic: msg.sender_pic,
      sender_tag: msg.sender_tag,
      timestamp: msg.timestamp
    }));

    res.status(200).json({
      status: 200,
      chats: messages
    });

  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
};

// Get DM history with images
const getDMHistory = async (req, res) => {
  try {
    const { user2 } = req.body;
    const user1 = req.userId;

    if (!user2) {
      return res.status(400).json({
        status: 400,
        message: 'Missing user2 parameter'
      });
    }

    const participants = [user1, user2].sort();
    const dmChat = await DMChat.findOne({ participants });

    if (!dmChat) {
      return res.status(200).json({
        status: 200,
        history: []
      });
    }

    // Transform messages to match frontend expectations
    const history = dmChat.messages.map(msg => ({
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderPic: msg.senderPic,
      content: msg.content || '',
      image: msg.image || null,
      timestamp: msg.timestamp,
      edited: msg.edited || false
    }));

    res.status(200).json({
      status: 200,
      history
    });

  } catch (error) {
    console.error('Error getting DM history:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
};

// Delete image message from server chat
const deleteImageMessage = async (req, res) => {
  try {
    const { channel_id, timestamp } = req.body;
    const userId = req.user.id;

    if (!channel_id || !timestamp) {
      return res.status(400).json({
        status: 400,
        message: 'Missing required fields'
      });
    }

    const chat = await Chat.findOne({ 'channels.channel_id': channel_id });

    if (!chat) {
      return res.status(404).json({
        status: 404,
        message: 'Chat not found'
      });
    }

    const channel = chat.channels.find(ch => ch.channel_id === channel_id);
    const messageIndex = channel.chat_details.findIndex(
      msg => msg.timestamp === timestamp.toString() && msg.sender_id === userId
    );

    if (messageIndex === -1) {
      return res.status(404).json({
        status: 404,
        message: 'Message not found or you are not authorized to delete it'
      });
    }

    channel.chat_details.splice(messageIndex, 1);
    await chat.save();

    res.status(200).json({
      status: 200,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting image message:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  storeImageMessage,
  storeDMImage,
  getMessages,
  getDMHistory,
  deleteImageMessage
};