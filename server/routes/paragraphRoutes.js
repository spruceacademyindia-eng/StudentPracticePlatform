const express = require('express');
const router = express.Router();
const {
  getParagraphs,
  getParagraph,
  createParagraph,
  updateParagraph,
  deleteParagraph,
} = require('../controllers/paragraphController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All paragraph routes require auth

router.route('/')
  .get(getParagraphs)
  .post(authorize('admin'), createParagraph);

router.route('/:id')
  .get(getParagraph)
  .put(authorize('admin'), updateParagraph)
  .delete(authorize('admin'), deleteParagraph);

module.exports = router;
