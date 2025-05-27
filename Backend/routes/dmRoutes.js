const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dmController = require('../controllers/dmController');
const imageController = require('../controllers/imageController');

router.post('/create_dm', auth, dmController.createDM);
router.get('/get_dms', auth, dmController.getDMs);
router.post('/store_dm_message', auth, dmController.storeDMMessage);
router.post('/get_dm_history', auth, dmController.getDMHistory);
router.post('/edit_dm_message', auth, dmController.editDMMessage);
router.post('/delete_dm_message', auth, dmController.deleteDMMessage);
router.post('/upload_dm_image', auth, imageController.uploadDmImage);
router.post('/store_dm_image', auth, imageController.storeDMImageMessage);

module.exports = router;