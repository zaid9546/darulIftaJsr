// ────────────────────────────────────────────────────
// @desc    Restrict access to super_admin only
// @usage   router.put('/approve', protect, superAdminOnly, handler)
// ────────────────────────────────────────────────────
const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Super Admins only.',
  });
};

// ────────────────────────────────────────────────────
// @desc    Allow mufti OR super_admin
// @usage   router.put('/answer', protect, muftiOrAdmin, handler)
// ────────────────────────────────────────────────────
const muftiOrAdmin = (req, res, next) => {
  if (req.user && ['mufti', 'super_admin'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Muftis or Admins only.',
  });
};

// ────────────────────────────────────────────────────
// @desc    Generic role checker factory
// @usage   protect, authorizeRoles('super_admin', 'mufti')
// ────────────────────────────────────────────────────
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access denied. Allowed roles: ${roles.join(', ')}.`,
    });
  };
};

module.exports = { superAdminOnly, muftiOrAdmin, authorizeRoles };
