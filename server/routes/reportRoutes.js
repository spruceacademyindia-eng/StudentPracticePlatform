const express = require('express');
const router = express.Router();
const {
  getStudentPerformanceReport,
  getCategoryPerformanceReport,
  getChallengeReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('ADMIN'));

router.get('/student', getStudentPerformanceReport);
router.get('/category', getCategoryPerformanceReport);
router.get('/challenge', getChallengeReport);

module.exports = router;

