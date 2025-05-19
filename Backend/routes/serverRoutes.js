const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const serverController = require('../controllers/serverController');

router.post('/create_server', auth, serverController.createServer);
router.post('/server_info', auth, serverController.getServerInfo);
router.post('/add_new_category', auth, serverController.addCategory);
router.post('/add_new_channel', auth, serverController.addChannel);

module.exports = router;
