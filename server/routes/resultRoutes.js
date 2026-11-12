const express = require('express');
const router = express.Router();
const {
  submitResult,
  getMyResults,
  getAllResults,
  getStudentsSummary,
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/',                 submitResult);           // Student submits result
router.get('/my',                getMyResults);           // Student views their history
router.get('/admin/all',         authorize('admin'), getAllResults);      // Admin: all results
router.get('/admin/students',    authorize('admin'), getStudentsSummary); // Admin: per-student stats

module.exports = router;
