const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

// @route   POST /api/dms/send
// @desc    Send a direct message
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ msg: 'Please provide receiver ID and message content' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ msg: 'Message cannot be empty' });
    }

    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      content: content.trim()
    });

    await message.save();

    // Return the populated message with sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profile_pic')
      .populate('receiver', 'username profile_pic');

    res.json(populatedMessage);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/dms/history
// @desc    Get message history between two users
// @desc    Returns messages in chronological order
// @access  Private
router.post('/history', auth, async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2) {
      return res.status(400).json({ msg: 'Please provide both user IDs' });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'username profile_pic')
    .populate('receiver', 'username profile_pic');

    res.json({ history: messages });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;