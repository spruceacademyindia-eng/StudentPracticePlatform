const Category = require('../models/Category');
const { logAdminAction } = require('../utils/logger');

// @route  GET /api/categories
// @access Public / Protected
exports.getCategories = async (req, res, next) => {
  try {
    const { status, parentOnly, parentId } = req.query;

    const filter = {};
    // If not admin, only show active categories
    if (!req.user || req.user.role !== 'ADMIN') {
      filter.status = 'ACTIVE';
    } else if (status) {
      filter.status = status;
    }

    if (parentOnly === 'true') {
      filter.parentCategory = null;
    } else if (parentId) {
      filter.parentCategory = parentId;
    }

    const categories = await Category.find(filter)
      .populate('parentCategory', 'name')
      .sort({ name: 1 });

    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/categories/:id
// @access Public / Protected
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).populate('parentCategory', 'name');
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

    // Find any subcategories
    const subcategories = await Category.find({ parentCategory: category._id, status: 'ACTIVE' });

    res.status(200).json({ success: true, category, subcategories });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/categories
// @access Admin only
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, parentCategory } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    // Check duplicate
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      parentCategory: parentCategory || null,
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists in this scope.' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      parentCategory: parentCategory || null,
      status: 'ACTIVE',
      createdBy: req.user._id,
    });

    await logAdminAction({
      adminId: req.user._id,
      action: 'CREATE_CATEGORY',
      entity: 'Category',
      entityId: category._id,
      metadata: { name: category.name, parentCategory: category.parentCategory },
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/categories/:id
// @access Admin only
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, parentCategory } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;

    await category.save();

    await logAdminAction({
      adminId: req.user._id,
      action: 'UPDATE_CATEGORY',
      entity: 'Category',
      entityId: category._id,
      metadata: { name: category.name },
    });

    res.status(200).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/categories/:id/status
// @access Admin only
exports.updateCategoryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid category status.' });
    }

    const category = await Category.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

    await logAdminAction({
      adminId: req.user._id,
      action: 'CHANGE_CATEGORY_STATUS',
      entity: 'Category',
      entityId: category._id,
      metadata: { newStatus: status },
    });

    res.status(200).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

