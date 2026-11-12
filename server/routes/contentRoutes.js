const express = require('express');
const router = express.Router();
const {
  getContentList,
  getContentById,
  createContent,
  updateContent,
  updateContentStatus,
} = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/auth');

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, getContentList);
router.get('/:id', optionalAuth, getContentById);
router.post('/', protect, authorize('ADMIN'), createContent);
router.put('/:id', protect, authorize('ADMIN'), updateContent);
router.patch('/:id/status', protect, authorize('ADMIN'), updateContentStatus);

module.exports = router;

