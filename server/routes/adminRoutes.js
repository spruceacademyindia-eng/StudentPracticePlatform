const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getUsers,
  toggleUserStatus,
  createAdmin,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.route('/settings').get(getSettings).put(updateSettings);
router.get('/users', getUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.post('/create-admin', createAdmin);

module.exports = router;
