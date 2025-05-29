const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.post('/register',upload.single('profile_pic'), authController.register);
router.post('/login', authController.login);

module.exports = router;
