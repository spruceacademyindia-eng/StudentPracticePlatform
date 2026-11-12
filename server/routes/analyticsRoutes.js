const express = require('express');
const router = express.Router();
const { getStudentAnalytics, getAdminAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/student', getStudentAnalytics);
router.get('/admin', authorize('ADMIN'), getAdminAnalytics);

module.exports = router;

