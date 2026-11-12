const express = require('express');
const router = express.Router();
const { getAdminLogs } = require('../controllers/adminLogController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('ADMIN'));

router.get('/', getAdminLogs);

module.exports = router;

