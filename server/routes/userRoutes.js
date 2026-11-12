const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  adminResetPassword,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('ADMIN'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);
router.post('/:id/reset-password', adminResetPassword);

module.exports = router;

