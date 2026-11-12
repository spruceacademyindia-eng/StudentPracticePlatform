const express = require('express');
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
