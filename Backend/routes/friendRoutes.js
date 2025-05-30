const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const friendController = require('../controllers/friendController');
const multer  = require('multer');
const upload  = multer();

router.post('/add_friend', upload.none(),auth, friendController.addFriend);
router.post('/process_req',  upload.none(), auth, friendController.processRequest);

module.exports = router;