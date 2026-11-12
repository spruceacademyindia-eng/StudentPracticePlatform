const express = require('express');
const router = express.Router();
const {
  getMyAttempts,
  getAllAttemptsAdmin,
  getAttemptById,
} = require('../controllers/attemptController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/my', getMyAttempts);
router.get('/admin', authorize('ADMIN'), getAllAttemptsAdmin);
router.get('/:id', getAttemptById);

module.exports = router;

