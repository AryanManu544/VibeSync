const express = require('express');
const auth = require('../middelware/fetchuser');
const Server = require('../models/Server');

const router = express.Router();

// GET all servers the user owns or is a member of
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const servers = await Server.find({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    });
    res.json(servers);
  } catch (err) {
    console.error('[ROUTES/SERVERS] Error fetching servers:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE a new server
router.post('/', auth, async (req, res) => {
  try {
    console.log('[DEBUG] req.user:', req.user); // ADD THIS LINE

    const { name, icon, isPrivate } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Server name is required and must be a string' });
    }
    const newServer = new Server({
      name: name.trim(),
      owner: req.user.id, // <-- if this is undefined, you’ll see it above
      members: [req.user.id],
      icon: icon || undefined,
      isPrivate: !!isPrivate,
    });

    await newServer.save();
    res.status(201).json(newServer);
  } catch (err) {
    console.error('[ROUTES/SERVERS] Error creating server:', err);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }

    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;