const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.post('/store_message', auth, chatController.storeMessage);
router.post('/get_messages', auth, chatController.getMessages);

module.exports = router;
