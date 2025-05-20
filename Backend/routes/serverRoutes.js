const express  = require('express');
const multer   = require('multer');
const auth     = require('../middleware/auth');
const ctrl     = require('../controllers/serverController');
const upload   = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post(
  '/create_server',
  auth,
  upload.single('server_image'),
  ctrl.createServer
);

router.post('/server_info',      auth, ctrl.getServerInfo);
router.post('/add_new_category', auth, ctrl.addCategory);
router.post('/add_new_channel',  auth, ctrl.addChannel);

module.exports = router;