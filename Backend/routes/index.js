const express = require('express');
const router = express.Router();

router.use(require('./authRoutes'));
router.use(require('./userRoutes'));
router.use(require('./friendRoutes'));
router.use(require('./serverRoutes'));
router.use(require('./dmRoutes'));
router.use('/invite', require('./inviteRoutes'));
router.use(require('./chatRoutes'));

module.exports = router;
