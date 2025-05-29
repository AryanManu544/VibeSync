const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const {
  storeImageMessage,
  storeDMImage,
  getMessages,
  getDMHistory,
  deleteImageMessage
} = require('../controllers/imageController');

router.post('/store_image_message', auth, storeImageMessage);

router.post('/store_dm_image', auth, storeDMImage);

router.post('/get_messages', auth, getMessages);

router.post('/get_dm_history', auth, getDMHistory);

router.post('/delete_image_message', auth, deleteImageMessage);

module.exports = router;