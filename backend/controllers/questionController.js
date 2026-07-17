const Question = require('../models/Question');
const User     = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { getNextSequence } = require('../utils/sequence');

// ════════════════════════════════════════════════════
//  SECTION 1 — PUBLIC ENDPOINTS
// ════════════════════════════════════════════════════

// ────────────────────────────────────────────────────
// @desc    Submit a new question (public)
// @route   POST /api/questions/submit
// @access  Public
// ────────────────────────────────────────────────────
exports.submitQuestion = async (req, res) => {
  try {
    const {
      questionText,
      language,
      category,
      tags,
      submittedBy, // { name, email, phone, isAnonymous }
    } = req.body;

    // ── Validate required fields ───────────────────────
    if (!questionText || !language || !category) {
      return res.status(400).json({
        success: false,
        message: 'Question text, language, and category are required.',
      });
    }

    // ── Build submitter info ───────────────────────────
    const submitterData = {
      isAnonymous: submittedBy?.isAnonymous ?? true,
      name:        submittedBy?.isAnonymous ? undefined : submittedBy?.name,
      email:       submittedBy?.isAnonymous ? undefined : submittedBy?.email,
      phone:       submittedBy?.isAnonymous ? undefined : submittedBy?.phone,
    };

    // ── Create question ────────────────────────────────
    const question = await Question.create({
      questionText: questionText.trim(),
      language,
      category,
      tags:        tags || [],
      submittedBy: submitterData,
      status:      'pending',
    });

    // ── Audit Log ──────────────────────────────────────
    await AuditLog.create({
      action:         'QUESTION_SUBMITTED',
      performedBy:    question._id, // No auth user; log question itself
      targetQuestion: question._id,
      details:        `Question submitted in ${language} under category: ${category}`,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Your question has been submitted successfully. It will be reviewed shortly.',
      data: {
        _id:         question._id,
        questionText: question.questionText,
        language:    question.language,
        category:    question.category,
        status:      question.status,
        createdAt:   question.createdAt,
      },
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('❌ submitQuestion Error:', err);
    res.status(500).json({ success: false, message: 'Server error while submitting question.' });
  }
};

// ────────────────────────────────────────────────────
// @desc    Get all published Fatwas (public feed)
// @route   GET /api/questions/public
// @access  Public
// Supports: language filter, category filter, search, pagination
// ────────────────────────────────────────────────────
exports.getPublicFeed = async (req, res) => {
  try {
    const {
      language,
      category,
      search,
      tags,
      page  = 1,
      limit = 10,
    } = req.query;

    // ── Build filter object ────────────────────────────
    const filter = { isPublic: true, status: 'published' };

    if (language && language !== 'all') filter.language = language;
    if (category && category !== 'all') filter.category = category;

    // ── Tag filter ─────────────────────────────────────
    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      filter.tags = { $in: tagArray };
    }

    // ── ✅ UPDATED: Regex search (fatwa number + keyword) ──
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      filter.$or = [
        { fatwaNumber:   searchRegex },   // ✅ FATWA-2026-000005
        { questionText:  searchRegex },   // question text
        { 'answer.text': searchRegex },   // answer text
        { category:      searchRegex },   // category
        { tags:          searchRegex },   // tags
      ];
    }

    // ── Pagination ─────────────────────────────────────
    const pageNum   = Math.max(1, parseInt(page));
    const limitNum  = Math.min(50, Math.max(1, parseInt(limit)));
    const skipNum   = (pageNum - 1) * limitNum;

    // ── Execute query ──────────────────────────────────
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .select(
          'questionText language category fatwaNumber fatwaDate ' +
          'answer approval isPublic publishedAt views tags createdAt'
        )
        .populate('answer.answeredBy',   'name specialization')
        .populate('approval.approvedBy', 'name')
        .sort({ publishedAt: -1 })         // ✅ simple sort (no $text)
        .skip(skipNum)
        .limit(limitNum)
        .lean(),

      Question.countDocuments(filter),
    ]);

    // ── Increment view count (fire-and-forget) ─────────
    if (questions.length > 0) {
      const ids = questions.map((q) => q._id);
      Question.updateMany({ _id: { $in: ids } }, { $inc: { views: 1 } })
        .exec()
        .catch((err) => console.error('View count update error:', err));
    }

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum < Math.ceil(total / limitNum),
        hasPrev:    pageNum > 1,
      },
      count: questions.length,
      data:  questions,
    });

  } catch (err) {
    console.error('❌ getPublicFeed Error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching feed.' });
  }
};


// ────────────────────────────────────────────────────
// @desc    Get Public Statistics
// @route   GET /api/questions/public/stats
// @access  Public
// ────────────────────────────────────────────────────
exports.getPublicStats = async (req, res) => {
  try {
    const [
      totalFatwas,
      totalViews,
      categoryStats,
      languageStats,
    ] = await Promise.all([
      Question.countDocuments({
        isPublic: true,
        status: "published",
      }),

      Question.aggregate([
        {
          $match: {
            isPublic: true,
            status: "published",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$views" },
          },
        },
      ]),

      Question.aggregate([
        {
          $match: {
            isPublic: true,
            status: "published",
          },
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]),

      Question.aggregate([
        {
          $match: {
            isPublic: true,
            status: "published",
          },
        },
        {
          $group: {
            _id: "$language",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalFatwas,
        totalViews: totalViews[0]?.total || 0,
        categories: categoryStats,
        languages: languageStats,
      },
    });

  } catch (err) {
    console.error("❌ getPublicStats Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// ────────────────────────────────────────────────────
// @desc    Get a single published Fatwa by ID
// @route   GET /api/questions/public/:id
// @access  Public
// ────────────────────────────────────────────────────
exports.getPublicFatwaById = async (req, res) => {
  try {
    const question = await Question.findOne({
      _id:      req.params.id,
      isPublic: true,
      status:   'published',
    })
      .populate('answer.answeredBy',   'name specialization languages')
      .populate('approval.approvedBy', 'name')
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Fatwa not found or not yet published.',
      });
    }

    // ── Increment view count ───────────────────────────
    Question.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })
      .exec()
      .catch((err) => console.error('View count error:', err));

    res.status(200).json({ success: true, data: question });

  } catch (err) {
    console.error('❌ getPublicFatwaById Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────
// @desc    Get a single published Fatwa by Fatwa Number
// @route   GET /api/questions/public/number/:fatwaNumber
// @access  Public
// ────────────────────────────────────────────────────
exports.getPublicFatwaByNumber = async (req, res) => {
  try {
    const question = await Question.findOne({
      fatwaNumber: req.params.fatwaNumber.toUpperCase(),
      isPublic:    true,
      status:      'published',
    })
      .populate('answer.answeredBy',   'name specialization')
      .populate('approval.approvedBy', 'name')
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: `No published Fatwa found with number: ${req.params.fatwaNumber}`,
      });
    }

    res.status(200).json({ success: true, data: question });

  } catch (err) {
    console.error('❌ getPublicFatwaByNumber Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════
//  SECTION 2 — SUPER ADMIN ENDPOINTS
// ════════════════════════════════════════════════════

// ────────────────────────────────────────────────────
// @desc    Get all questions (admin dashboard)
// @route   GET /api/questions/admin/all
// @access  Private (super_admin)
// ────────────────────────────────────────────────────
exports.getAllQuestionsAdmin = async (req, res) => {
  try {
    const {
      status,
      language,
      category,
      assignedTo,
      page  = 1,
      limit = 20,
    } = req.query;

    // ── Build filter ───────────────────────────────────
    const filter = {};
    if (status)     filter.status     = status;
    if (language)   filter.language   = language;
    if (category)   filter.category   = category;
    if (assignedTo) filter.assignedTo = assignedTo;

    // ── Pagination ─────────────────────────────────────
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skipNum  = (pageNum - 1) * limitNum;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('assignedTo', 'name email specialization languages')
        .populate('assignedBy', 'name')
        .populate('answer.answeredBy', 'name')
        .populate('approval.approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),

      Question.countDocuments(filter),
    ]);

    // ── Status-wise counts (for dashboard widgets) ─────
    const statusCounts = await Question.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      statusCounts: counts,
      count: questions.length,
      data:  questions,
    });

  } catch (err) {
    console.error('❌ getAllQuestionsAdmin Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────
// @desc    Assign question to a Mufti
// @route   PUT /api/questions/:id/assign
// @access  Private (super_admin)
// ────────────────────────────────────────────────────
exports.assignQuestion = async (req, res) => {
  try {
    const { muftiIds } = req.body;

    if (!Array.isArray(muftiIds) || muftiIds.length === 0) {
  return res.status(400).json({
    success: false,
    message: 'Please select at least one Mufti.',
  });
}

    // ── Validate mufti exists and is active ────────────
    const muftis = await User.find({
  _id: { $in: muftiIds },
  role: "mufti",
  isActive: true,
});

if (muftis.length !== muftiIds.length) {
  return res.status(404).json({
    success: false,
    message: "One or more selected Muftis were not found.",
  });
}

    // ── Find & validate question ───────────────────────
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    if (!['pending', 'revision'].includes(question.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign a question with status: "${question.status}".`,
      });
    }

    // ── Update question ────────────────────────────────
    question.assignedTo = muftiIds;
    question.assignedBy = req.user._id;
    question.assignedAt = new Date();
    question.status     = 'assigned';
    await question.save();

    // ── Audit Log ──────────────────────────────────────
    await AuditLog.create({
      action:         'QUESTION_ASSIGNED',
      performedBy:    req.user._id,
      targetQuestion: question._id,
      details: `Assigned to Muftis: ${muftis.map(m => m.name).join(", ")}`,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: `Question assigned successfully to ${muftis.length} Mufti(s).`,
      data:    question,
    });

  } catch (err) {
    console.error('❌ assignQuestion Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────
// @desc    Request revision on an answered question
// @route   PUT /api/questions/:id/revision
// @access  Private (super_admin)
// ────────────────────────────────────────────────────
exports.requestRevision = async (req, res) => {
  try {
    const { revisionNote } = req.body;

    if (!revisionNote || revisionNote.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A revision note of at least 5 characters is required.',
      });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    if (question.status !== 'answered') {
      return res.status(400).json({
        success: false,
        message: 'Revision can only be requested on answered questions.',
      });
    }

    // ── Update question ────────────────────────────────
    question.answer.revisionNote = revisionNote.trim();
    question.status              = 'revision';
    await question.save();

    // ── Audit Log ──────────────────────────────────────
    await AuditLog.create({
      action:         'QUESTION_REVISION_REQUESTED',
      performedBy:    req.user._id,
      targetQuestion: question._id,
      details:        `Revision note: ${revisionNote.trim()}`,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Revision requested. Question sent back to the Mufti.',
      data:    question,
    });

  } catch (err) {
    console.error('❌ requestRevision Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────
// @desc    Approve & publish a question (generate Fatwa Number + Date)
// @route   PUT /api/questions/:id/approve
// @access  Private (super_admin)
// ────────────────────────────────────────────────────
exports.approveQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    if (question.status !== 'answered') {
      return res.status(400).json({
        success: false,
        message: 'Only answered questions can be approved.',
      });
    }

    // ── Generate stamp code ────────────────────────────
    const stampCode = question.generateStampCode();

    // ── Generate unique Fatwa Number (atomic) ──────────
    const seq    = await getNextSequence('fatwa');
    const year   = new Date().getFullYear();
    const padded = String(seq).padStart(6, '0');
    const fatwaNumber = `FATWA-${year}-${padded}`; // e.g., FATWA-2026-000001

    // ── Set Fatwa Date (server UTC) ────────────────────
    const fatwaDate = new Date();

    // ── Update question ────────────────────────────────
    question.approval = {
      isApproved: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      stampCode,
      notes: req.body.notes || null,
    };
    question.fatwaNumber = fatwaNumber;
    question.fatwaDate   = fatwaDate;
    question.status      = 'published';
    question.isPublic    = true;
    question.publishedAt = new Date();

    await question.save();

    // ── Audit Log ──────────────────────────────────────
    await AuditLog.create({
      action:         'QUESTION_APPROVED',
      performedBy:    req.user._id,
      targetQuestion: question._id,
      details:        `Stamp: ${stampCode} | Fatwa: ${fatwaNumber}`,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });

    res.status(200).json({
      success:     true,
      message:     'Question approved and published successfully.',
      stampCode,
      fatwaNumber,
      fatwaDate,
      data:        question,
    });

  } catch (err) {
    // ── Handle rare duplicate fatwaNumber collision ────
    if (err.code === 11000) {
      console.error('⚠️ Duplicate fatwaNumber — retrying...');
      return res.status(500).json({
        success: false,
        message: 'Fatwa number collision. Please retry the approval.',
      });
    }
    console.error('❌ approveQuestion Error:', err);
    res.status(500).json({ success: false, message: 'Server error during approval.' });
  }
};

// ────────────────────────────────────────────────────
// @desc    Reject a question
// @route   PUT /api/questions/:id/reject
// @access  Private (super_admin)
// ────────────────────────────────────────────────────
exports.rejectQuestion = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason of at least 5 characters is required.',
      });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    if (['published', 'rejected'].includes(question.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a question with status: "${question.status}".`,
      });
    }

    // ── Update question ────────────────────────────────
    question.status          = 'rejected';
    question.rejectionReason = rejectionReason.trim();
    question.isPublic        = false;
    await question.save();

    // ── Audit Log ──────────────────────────────────────
    await AuditLog.create({
      action:         'QUESTION_REJECTED',
      performedBy:    req.user._id,
      targetQuestion: question._id,
      details:        `Rejection reason: ${rejectionReason.trim()}`,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Question has been rejected.',
      data:    question,
    });

  } catch (err) {
    console.error('❌ rejectQuestion Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════
//  SECTION 3 — MUFTI ENDPOINTS
// ════════════════════════════════════════════════════

// ────────────────────────────────────────────────────
// @desc    Get questions assigned to logged-in Mufti
// @route   GET /api/questions/mufti/assigned
// @access  Private (mufti)
// ────────────────────────────────────────────────────
exports.getMuftiAssigned = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {
  assignedTo: { $in: [req.user._id] }
};
    if (status) filter.status = status;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skipNum  = (pageNum - 1) * limitNum;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .select('questionText language category status answer assignedAt createdAt tags')
        .sort({ assignedAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),

      Question.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      count: questions.length,
      data:  questions,
    });

  } catch (err) {
    console.error('❌ getMuftiAssigned Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ────────────────────────────────────────────────────
// @desc    Mufti submits an answer
// @route   PUT /api/questions/:id/answer
// @access  Private (mufti)
// ────────────────────────────────────────────────────
exports.submitAnswer = async (req, res) => {
  try {
    const { answerText, references } = req.body;

    if (!answerText || answerText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Answer text must be at least 10 characters.',
      });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    // ── Ensure mufti owns this question ───────────────
    const isAssigned = question.assignedTo.some(
  (id) => id.toString() === req.user._id.toString()
);

if (!isAssigned) {
  return res.status(403).json({
    success: false,
    message: "You are not assigned to this question.",
  });
}

    if (!['assigned', 'revision'].includes(question.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot answer a question with status: "${question.status}".`,
      });
    }

    // ── Update answer ──────────────────────────────────
    question.answer = {
      text:         answerText.trim(),
      references:   references || [],
      answeredBy:   req.user._id,
      answeredAt:   new Date(),
      revisionNote: null, // Clear previous revision note
    };
    question.status = 'answered';
    await question.save();

    // ── Audit Log ──────────────────────────────────────
    await AuditLog.create({
      action:         'QUESTION_ANSWERED',
      performedBy:    req.user._id,
      targetQuestion: question._id,
      details:        `Answer submitted by Mufti: ${req.user.name}`,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Answer submitted successfully. Awaiting Super Admin review.',
      data:    question,
    });

  } catch (err) {
    console.error('❌ submitAnswer Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
