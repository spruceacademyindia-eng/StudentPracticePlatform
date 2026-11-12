const express = require('express');
const router = express.Router();
const { startTypingSession, submitTypingSession } = require('../controllers/typingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/start', startTypingSession);
router.post('/submit', submitTypingSession);

module.exports = router;

