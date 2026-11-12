const TypingContent = require('../models/TypingContent');
const Category = require('../models/Category');
const { logAdminAction } = require('../utils/logger');

// @route  GET /api/content
// @access Public / Protected
exports.getContentList = async (req, res, next) => {
  try {
    const {
      category,
      subcategory,
      mode,
      difficulty,
      status,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Students only see ACTIVE content
    if (!req.user || req.user.role !== 'ADMIN') {
      filter.status = 'ACTIVE';
    } else if (status) {
      filter.status = status;
    }

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (difficulty) filter.difficulty = difficulty;

    if (mode && mode !== 'BOTH') {
      filter.mode = { $in: [mode, 'BOTH'] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [contentList, total] = await Promise.all([
      TypingContent.find(filter)
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TypingContent.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      content: contentList,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/content/:id
// @access Public / Protected
exports.getContentById = async (req, res, next) => {
  try {
    const content = await TypingContent.findById(req.params.id)
      .populate('category', 'name')
      .populate('subcategory', 'name');

    if (!content) return res.status(404).json({ success: false, message: 'Content not found.' });

    // Students can only view active content
    if ((!req.user || req.user.role !== 'ADMIN') && content.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Content is not active or available.' });
    }

    res.status(200).json({ success: true, content });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/content
// @access Admin only
exports.createContent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      content,
      category,
      subcategory,
      mode,
      difficulty,
      targetWPM,
      minimumAccuracy,
    } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content, and category are required.' });
    }

    // Validate category exists
    const cat = await Category.findById(category);
    if (!cat) {
      return res.status(400).json({ success: false, message: 'Selected category does not exist.' });
    }

    // Auto-calculate word & char count
    const characterCount = content.length;
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount < 10) {
      return res.status(400).json({ success: false, message: 'Content must contain at least 10 words.' });
    }

    const newContent = await TypingContent.create({
      title: title.trim(),
      description: description || '',
      content: content.trim(),
      category,
      subcategory: subcategory || null,
      wordCount,
      characterCount,
      mode: mode || 'BOTH',
      difficulty: difficulty || 'MEDIUM',
      targetWPM: targetWPM ? Number(targetWPM) : 30,
      minimumAccuracy: minimumAccuracy ? Number(minimumAccuracy) : 80,
      status: 'ACTIVE',
      createdBy: req.user._id,
    });

    await logAdminAction({
      adminId: req.user._id,
      action: 'CREATE_CONTENT',
      entity: 'TypingContent',
      entityId: newContent._id,
      metadata: { title: newContent.title, wordCount, mode: newContent.mode },
    });

    res.status(201).json({ success: true, content: newContent });
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/content/:id
// @access Admin only
exports.updateContent = async (req, res, next) => {
  try {
    const item = await TypingContent.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Content not found.' });

    const fields = [
      'title',
      'description',
      'content',
      'category',
      'subcategory',
      'mode',
      'difficulty',
      'targetWPM',
      'minimumAccuracy',
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });

    // Recompute wordCount and characterCount if content changed
    if (req.body.content) {
      item.characterCount = item.content.length;
      item.wordCount = item.content.trim().split(/\s+/).filter(Boolean).length;
    }

    await item.save();

    await logAdminAction({
      adminId: req.user._id,
      action: 'UPDATE_CONTENT',
      entity: 'TypingContent',
      entityId: item._id,
      metadata: { title: item.title },
    });

    res.status(200).json({ success: true, content: item });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/content/:id/status
// @access Admin only
exports.updateContentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const item = await TypingContent.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Content not found.' });

    await logAdminAction({
      adminId: req.user._id,
      action: 'CHANGE_CONTENT_STATUS',
      entity: 'TypingContent',
      entityId: item._id,
      metadata: { newStatus: status },
    });

    res.status(200).json({ success: true, content: item });
  } catch (err) {
    next(err);
  }
};

