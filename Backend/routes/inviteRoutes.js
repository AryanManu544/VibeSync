const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');
const auth = require('../middleware/auth'); 

router.post('/create_invite_link', auth, inviteController.createInvite); 
router.post('/invite_link_info',auth, inviteController.getInviteInfo);
router.post('/accept_invite', auth, inviteController.acceptInvite);

module.exports = router;