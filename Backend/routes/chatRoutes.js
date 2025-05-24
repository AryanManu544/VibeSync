const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.post('/store_message', auth, chatController.storeMessage);
router.post('/get_messages', auth, chatController.getMessages);
router.post('/delete_message', auth, chatController.delete_message);
router.post('/edit_message', auth, chatController.edit_message);

module.exports = router;