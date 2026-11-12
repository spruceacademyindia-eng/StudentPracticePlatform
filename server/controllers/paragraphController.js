const Paragraph = require('../models/Paragraph');

// @route  GET /api/paragraphs
// @access Protected (student + admin)
// @query  domain, mode, page, limit
exports.getParagraphs = async (req, res, next) => {
  try {
    const { domain, mode, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };
    if (domain) filter.domain = domain;
    if (mode && mode !== 'both') {
      filter.$or = [{ mode }, { mode: 'both' }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [paragraphs, total] = await Promise.all([
      Paragraph.find(filter)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Paragraph.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      paragraphs,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/paragraphs/:id
// @access Protected
exports.getParagraph = async (req, res, next) => {
  try {
    const para = await Paragraph.findById(req.params.id).populate('createdBy', 'name');
    if (!para || !para.isActive) {
      return res.status(404).json({ success: false, message: 'Paragraph not found' });
    }
    res.status(200).json({ success: true, paragraph: para });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/paragraphs
// @access Admin only
exports.createParagraph = async (req, res, next) => {
  try {
    const { title, description, content, domain, wordCountLimit, mode, targetWpm } = req.body;

    const para = await Paragraph.create({
      title,
      description,
      content,
      domain,
      wordCountLimit,
      mode: mode || 'both',
      targetWpm: targetWpm || 20,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, paragraph: para });
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/paragraphs/:id
// @access Admin only
exports.updateParagraph = async (req, res, next) => {
  try {
    const para = await Paragraph.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!para) return res.status(404).json({ success: false, message: 'Paragraph not found' });
    res.status(200).json({ success: true, paragraph: para });
  } catch (err) {
    next(err);
  }
};

// @route  DELETE /api/paragraphs/:id
// @access Admin only
exports.deleteParagraph = async (req, res, next) => {
  try {
    const para = await Paragraph.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!para) return res.status(404).json({ success: false, message: 'Paragraph not found' });
    res.status(200).json({ success: true, message: 'Paragraph deactivated' });
  } catch (err) {
    next(err);
  }
};
