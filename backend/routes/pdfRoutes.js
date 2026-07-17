const express = require('express');
const router  = express.Router();

const {
  downloadFatwaPDF,
  previewFatwaPDF,
  bulkExportPDF,
  getPDFInfo,
} = require('../controllers/pdfController');

const { protect }        = require('../middleware/authMiddleware');
const { superAdminOnly } = require('../middleware/roleMiddleware');

// ── Public PDF download (published Fatwas only) ───────
// Auth is optional — middleware injects user if token present
router.get(
  '/fatwa/:id',
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) return protect(req, res, next);
    next();
  },
  downloadFatwaPDF
);

// ── Inline browser preview ────────────────────────────
router.get(
  '/fatwa/:id/preview',
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) return protect(req, res, next);
    next();
  },
  previewFatwaPDF
);

// ── PDF metadata ──────────────────────────────────────
router.get(
  '/fatwa/:id/info',
  protect,
  superAdminOnly,
  getPDFInfo
);

// ── Bulk export (admin only) ──────────────────────────
router.post(
  '/bulk-export',
  protect,
  superAdminOnly,
  bulkExportPDF
);

module.exports = router;
