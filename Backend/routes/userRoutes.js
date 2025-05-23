const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const User = require('../models/User');
const multer  = require('multer');
const upload  = multer({ storage: multer.memoryStorage() });

router.get('/user_relations', auth, userController.getUserRelations);
router.post('/get_user_by_id', auth, userController.getUserById);
router.get('/get_friends', auth, async (req, res) => {
  try {
    const foundUser = await User.findOne({ _id: req.userId });

    if (!foundUser || !foundUser.friends) {
      return res.json({ friends: [] });
    }

    return res.json({ friends: foundUser.friends });
  } catch (err) {
    console.error('❌ /get_friends error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
router.put('/update_picture',  auth, upload.single('profile_pic'), ctrl.update_picture);
router.put('/update_name',     auth, userController.update_name);
router.put('/update_email',    auth, userController.update_email);
router.put('/update_password', auth, userController.update_password);

module.exports = router;