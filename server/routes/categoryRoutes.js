const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

// Optional auth on GET so public/student can fetch active categories
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, getCategories);
router.get('/:id', optionalAuth, getCategoryById);
router.post('/', protect, authorize('ADMIN'), createCategory);
router.put('/:id', protect, authorize('ADMIN'), updateCategory);
router.patch('/:id/status', protect, authorize('ADMIN'), updateCategoryStatus);

module.exports = router;

