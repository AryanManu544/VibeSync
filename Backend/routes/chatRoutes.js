const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const imageController = require('../controllers/imageController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/store_message', auth, chatController.storeMessage);
router.post('/get_messages', auth, chatController.getMessages);
router.post('/delete_message', auth, chatController.delete_message);
router.post('/edit_message', auth, chatController.edit_message);
router.post('/upload_channel_image', auth, upload.single('image'), imageController.uploadChannelImage);
router.post('/store_image',auth, imageController.storeChannelImageMessage);

module.exports = router;