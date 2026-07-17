const Question         = require('../models/Question');
const AuditLog         = require('../models/AuditLog');
const { generateFatwaPDF, generateBulkPDF } = require('../utils/pdfGenerator');

// ────────────────────────────────────────────────────
// @desc    Download PDF for a single published Fatwa
// @route   GET /api/pdf/fatwa/:id
// @access  Public (published only) | Admin (any status)
// ────────────────────────────────────────────────────
exports.downloadFatwaPDF = async (req, res) => {
  try {
    const { id }    = req.params;
    const isAdmin   = req.user?.role === 'super_admin';

    // ── Build query based on role ──────────────────
    const filter = { _id: id };
    if (!isAdmin) {
      filter.isPublic = true;
      filter.status   = 'published';
    }

    const fatwa = await Question.findOne(filter)
      .populate('assignedTo',          'name specialization')
      .populate('answer.answeredBy',   'name specialization')
      .populate('approval.approvedBy', 'name')
      .lean();

    if (!fatwa) {
      return res.status(404).json({
        success: false,
        message: isAdmin
          ? 'Question not found.'
          : 'Fatwa not found or not yet published.',
      });
    }

    // ── Generate PDF buffer ────────────────────────
    const pdfBuffer = await generateFatwaPDF(fatwa);

    // ── Increment view count (published only) ──────
    if (fatwa.isPublic) {
      await Question.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }

    // ── Audit log for admin downloads ─────────────
    if (isAdmin) {
      await AuditLog.create({
        action:         'PDF_DOWNLOADED',
        performedBy:    req.user._id,
        targetQuestion: fatwa._id,
        details:        `Admin downloaded PDF for: ${fatwa.fatwaNumber || fatwa._id}`,
        ipAddress:      req.ip,
        userAgent:      req.headers['user-agent'],
      });
    }

    // ── Safe filename ─────────────────────────────
    const filename = fatwa.fatwaNumber
      ? `${fatwa.fatwaNumber}.pdf`
      : `fatwa-${id}.pdf`;

    // ── Send PDF response ─────────────────────────
    res.setHeader('Content-Type',        'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length',      pdfBuffer.length);
    res.setHeader('Cache-Control',       'no-cache, no-store, must-revalidate');

    res.status(200).end(pdfBuffer);

  } catch (err) {
    console.error('❌ downloadFatwaPDF Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
  }
};

// ────────────────────────────────────────────────────
// @desc    Preview PDF inline in browser (no download)
// @route   GET /api/pdf/fatwa/:id/preview
// @access  Public (published only) | Admin (any status)
// ────────────────────────────────────────────────────
exports.previewFatwaPDF = async (req, res) => {
  try {
    const { id }  = req.params;
    const isAdmin = req.user?.role === 'super_admin';

    const filter = { _id: id };
    if (!isAdmin) { filter.isPublic = true; filter.status = 'published'; }

    const fatwa = await Question.findOne(filter)
      .populate('assignedTo',          'name specialization')
      .populate('answer.answeredBy',   'name specialization')
      .populate('approval.approvedBy', 'name')
      .lean();

    if (!fatwa) {
      return res.status(404).json({ success: false, message: 'Fatwa not found.' });
    }

    const pdfBuffer = await generateFatwaPDF(fatwa);

    // ── Inline display (no download prompt) ───────
    res.setHeader('Content-Type',        'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fatwa.fatwaNumber || id}.pdf"`);
    res.setHeader('Content-Length',      pdfBuffer.length);

    res.status(200).end(pdfBuffer);

  } catch (err) {
    console.error('❌ previewFatwaPDF Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate PDF preview.' });
  }
};

// ────────────────────────────────────────────────────
// @desc    Bulk export selected Fatwas as ZIP of PDFs
// @route   POST /api/pdf/bulk-export
// @access  Private (super_admin only)
// ────────────────────────────────────────────────────
exports.bulkExportPDF = async (req, res) => {
  try {
    const { ids, status, language, category } = req.body;

    // ── Build filter ───────────────────────────────
    let filter = {};

    if (ids && Array.isArray(ids) && ids.length > 0) {
      // Export specific IDs
      filter._id = { $in: ids };
    } else {
      // Export by filters
      if (status)   filter.status   = status;
      if (language) filter.language = language;
      if (category) filter.category = category;

      // Default to published only
      if (!status) {
        filter.status   = 'published';
        filter.isPublic = true;
      }
    }

    // ── Safety cap ────────────────────────────────
    const fatwas = await Question.find(filter)
      .populate('answer.answeredBy',   'name specialization')
      .populate('approval.approvedBy', 'name')
      .limit(50)                         // Max 50 PDFs per bulk export
      .lean();

    if (fatwas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No Fatwas found matching the given criteria.',
      });
    }

    // ── Generate ZIP ─────────────────────────────
    const zipBuffer = await generateBulkPDF(fatwas);

    // ── Audit log ─────────────────────────────────
    await AuditLog.create({
      action:      'BULK_PDF_EXPORTED',
      performedBy: req.user._id,
      details:     `Bulk exported ${fatwas.length} Fatwas as ZIP`,
      ipAddress:   req.ip,
      userAgent:   req.headers['user-agent'],
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename  = `fatwas-export-${timestamp}.zip`;

    res.setHeader('Content-Type',        'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length',      zipBuffer.length);

    res.status(200).end(zipBuffer);

  } catch (err) {
    console.error('❌ bulkExportPDF Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate bulk export.' });
  }
};

// ────────────────────────────────────────────────────
// @desc    Get PDF metadata (size estimate, page count)
// @route   GET /api/pdf/fatwa/:id/info
// @access  Private (super_admin)
// ────────────────────────────────────────────────────
exports.getPDFInfo = async (req, res) => {
  try {
    const fatwa = await Question.findById(req.params.id).lean();

    if (!fatwa) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    // Estimate pages
    const textLength   = (fatwa.questionText?.length || 0) + (fatwa.answer?.text?.length || 0);
    const estimatedPages = Math.max(1, Math.ceil(textLength / 2000));
    const estimatedSizeKB = estimatedPages * 80;  // ~80KB per page

    res.status(200).json({
      success: true,
      data: {
        fatwaNumber:       fatwa.fatwaNumber,
        language:          fatwa.language,
        estimatedPages,
        estimatedSizeKB,
        hasAnswer:         !!fatwa.answer?.text,
        hasStamp:          !!fatwa.approval?.isApproved,
        referencesCount:   fatwa.answer?.references?.length || 0,
      },
    });
  } catch (err) {
    console.error('❌ getPDFInfo Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
