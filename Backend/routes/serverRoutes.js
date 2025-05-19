const express = require('express');
const router = express.Router();
const multer  = require('multer');
const auth = require('../middleware/auth');
const serverController = require('../controllers/serverController');
const upload  = multer({ storage: multer.memoryStorage() });

router.post('/create_server', auth,  upload.single('server_image'), serverController.createServer);
router.post('/server_info', auth, serverController.getServerInfo);
router.post('/add_new_category', auth, serverController.addCategory);
router.post('/add_new_channel', auth, serverController.addChannel);

module.exports = router;
