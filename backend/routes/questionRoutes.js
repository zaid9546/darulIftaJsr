const express = require('express');
const router  = express.Router();

const {
  // Public
  submitQuestion,
  getPublicFeed,
  getPublicStats,
  getPublicFatwaById,
  getPublicFatwaByNumber,

  // Super Admin
  getAllQuestionsAdmin,
  assignQuestion,
  requestRevision,
  approveQuestion,
  rejectQuestion,

  // Mufti
  getMuftiAssigned,
  submitAnswer,
} = require('../controllers/questionController');

const { protect }                        = require('../middleware/authMiddleware');
const { superAdminOnly, muftiOrAdmin }   = require('../middleware/roleMiddleware');

// ════════════════════════════════════════════════════
//  PUBLIC ROUTES — No authentication required
// ════════════════════════════════════════════════════

// Submit a new question
router.post('/submit', submitQuestion);

// Browse published Fatwas (with filters + search + pagination)
router.get('/public', getPublicFeed);

router.get('/public/stats', getPublicStats);

// Get single Fatwa by Fatwa Number (e.g., FATWA-2026-000001)
router.get('/public/number/:fatwaNumber', getPublicFatwaByNumber);

// Get single Fatwa by MongoDB ID
router.get('/public/:id', getPublicFatwaById);

// ════════════════════════════════════════════════════
//  SUPER ADMIN ROUTES — JWT + super_admin role required
// ════════════════════════════════════════════════════

// Admin dashboard — all questions with filters
router.get('/admin/all', protect, superAdminOnly, getAllQuestionsAdmin);

// Assign question to a Mufti
router.put('/:id/assign', protect, superAdminOnly, assignQuestion);

// Request revision on an answered question
router.put('/:id/revision', protect, superAdminOnly, requestRevision);

// Approve & publish (generates fatwaNumber + fatwaDate)
router.put('/:id/approve', protect, superAdminOnly, approveQuestion);

// Reject a question
router.put('/:id/reject', protect, superAdminOnly, rejectQuestion);

// ════════════════════════════════════════════════════
//  MUFTI ROUTES — JWT + mufti or admin role required
// ════════════════════════════════════════════════════

// Get all questions assigned to logged-in Mufti
router.get('/mufti/assigned', protect, muftiOrAdmin, getMuftiAssigned);

// Submit an answer to an assigned question
router.put('/:id/answer', protect, muftiOrAdmin, submitAnswer);

module.exports = router;
