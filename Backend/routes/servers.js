const express = require('express');
const Server  = require('../models/Server');

const router  = express.Router();

router.get('/', async (req, res) => {
  try {
    const all = await Server.find({ /* you can filter by user if you like */ });
    res.json(all);
  } catch (err) {
    console.error('Error fetching servers:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
