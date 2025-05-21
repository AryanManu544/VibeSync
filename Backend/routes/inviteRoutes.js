const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');

router.post('/create_invite_link', inviteController.createInvite);
router.post('/invite_link_info', inviteController.getInviteInfo);
router.post('/accept_invite', auth, inviteController.acceptInvite);

module.exports = router;