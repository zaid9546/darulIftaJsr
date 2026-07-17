const express = require('express');
const router  = express.Router();

const {
  loginUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  getMe,
  logout,
  // ❌ registerUser REMOVED — it lives in userController/userRoutes
} = require('../controllers/authController');

const { protect }        = require('../middleware/authMiddleware');
const { superAdminOnly } = require('../middleware/roleMiddleware');

// ── Public Routes ──────────────────────────────────────
router.post('/login',                  loginUser);
router.post('/forgot-password',        forgotPassword);
router.post('/reset-password/:token',  resetPassword);

// ── Protected: Any Authenticated User ─────────────────
router.post('/logout',   protect, logout);
router.get ('/me',       protect, getMe);
router.patch('/profile', protect, updateProfile);


module.exports = router;
