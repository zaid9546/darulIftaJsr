const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ────────────────────────────────────────────────────
// @desc    Protect routes — verify JWT token
// Reads from: HTTP-only cookie OR Authorization header
// ────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // ── 1. Try reading from HTTP-only cookie (preferred) ──
    if (req.cookies?.jwt && req.cookies.jwt !== 'loggedout') {
      token = req.cookies.jwt;

    // ── 2. Fallback: Authorization: Bearer <token> ─────────
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // ── No token found ─────────────────────────────────────
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in.',
      });
    }

    // ── Verify token ───────────────────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Fetch user from DB ─────────────────────────────────
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.',
      });
    }

    // ── Attach user to request & continue ─────────────────
    req.user = user;
    next();

  } catch (err) {
    console.error('❌ Auth Middleware Error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

// ── Role-based access control ──────────────────────────
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
