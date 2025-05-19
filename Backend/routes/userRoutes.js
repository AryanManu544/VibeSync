const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/user_relations', auth, userController.getUserRelations);
router.post('/get_user_by_id', auth, userController.getUserById);

module.exports = router;
