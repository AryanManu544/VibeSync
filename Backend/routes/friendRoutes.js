const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const friendController = require('../controllers/friendController');

router.post('/add_friend', auth, friendController.addFriend);
router.post('/process_req', auth, friendController.processRequest);

module.exports = router;
