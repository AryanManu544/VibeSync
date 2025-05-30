const express           = require('express');
const router            = express.Router();
const authController    = require('../controllers/authController');
const authMiddleware    = require('../middleware/auth');
const cookieParser      = require('cookie-parser');

router.use(cookieParser());

router.post('/register', authController.register);
router.post('/login',    authController.login);
router.post('/logout',   authMiddleware, authController.logout);
router.post(
  '/refresh_token',
  authController.refreshToken
);

module.exports = router;