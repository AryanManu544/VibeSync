const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const imageController = require('../controllers/imageController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // e.g., '.jpg'
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/store_message', auth, chatController.storeMessage);
router.post('/get_messages', auth, chatController.getMessages);
router.post('/delete_message', auth, chatController.delete_message);
router.post('/edit_message', auth, chatController.edit_message);
router.post('/upload_channel_image', auth, upload.single('image'), imageController.uploadChannelImage);
router.post('/store_image', auth, imageController.storeChannelImageMessage);

module.exports = router;