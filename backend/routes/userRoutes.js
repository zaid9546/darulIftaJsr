const express = require('express');
const router  = express.Router();

const {
  getActiveMuftis,
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,  // ✅ single toggle handler
  editMufti,
  deleteUser,        // ✅ single delete handler
  getAuditLogs,
  registerUser,      // ✅ register lives here
} = require('../controllers/userController');

const { protect }        = require('../middleware/authMiddleware');
const { superAdminOnly } = require('../middleware/roleMiddleware');

// ── All routes below require: logged in + super_admin ──
router.use(protect, superAdminOnly);

// ─────────────────────────────────────────────────────
// ⚠️  IMPORTANT: Specific routes MUST come BEFORE /:id
//     Otherwise /muftis and /audit-logs get caught by /:id
// ─────────────────────────────────────────────────────

// ── Register new Mufti ────────────────────────────────
router.post('/register',          registerUser);

// ── Mufti list ────────────────────────────────────────
router.get('/muftis',             getActiveMuftis);

// ── Audit logs ────────────────────────────────────────
router.get('/audit-logs',         getAuditLogs);

// ── User list ─────────────────────────────────────────
router.get('/',                   getAllUsers);

// ── Single user ───────────────────────────────────────
router.get('/:id',                getUserById);

// ── Update user fields ────────────────────────────────
router.put('/:id',                updateUser);

// ── Toggle active status ──────────────────────────────
router.patch('/:id/toggle-status', toggleUserStatus);

// ── Edit Mufti profile ────────────────────────────────
router.patch('/:id/edit',          editMufti);

// ── Delete user ───────────────────────────────────────
router.delete('/:id',              deleteUser);

module.exports = router;
