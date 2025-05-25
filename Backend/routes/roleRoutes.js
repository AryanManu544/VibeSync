const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

router.post('/add_role', roleController.addRole);
router.post('/assign_role', roleController.assignRole);
router.post('/remove_role', roleController.removeRole);
router.post('/get_roles', roleController.getRoles);
router.post('/get_user_roles', roleController.getUserRoles);

module.exports = router;