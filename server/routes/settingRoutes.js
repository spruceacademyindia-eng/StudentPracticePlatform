const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getSettings);
router.put('/', protect, authorize('ADMIN'), updateSettings);

module.exports = router;

