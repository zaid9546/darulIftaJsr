const User     = require('../models/User');
const AuditLog = require('../models/AuditLog');
const bcrypt   = require('bcryptjs');

// ════════════════════════════════════════════════════
// @desc    Get all Muftis — ALL (for management page)
// @route   GET /api/users/muftis
// @access  Private — super_admin
// ════════════════════════════════════════════════════
exports.getActiveMuftis = async (req, res) => {
  try {
    const muftis = await User.find({ role: 'mufti' })
      .select('name email phone specialization languages isActive createdAt')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count:   muftis.length,
      data:    muftis,
    });
  } catch (err) {
    console.error('❌ getActiveMuftis Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════
// @desc    Get all users
// @route   GET /api/users
// @access  Private — super_admin
// ════════════════════════════════════════════════════
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role)                filter.role     = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skipNum  = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      count: users.length,
      data:  users,
    });
  } catch (err) {
    console.error('❌ getAllUsers Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════
// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private — super_admin
// ════════════════════════════════════════════════════
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('❌ getUserById Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════
// @desc    Update user fields
// @route   PUT /api/users/:id
// @access  Private — super_admin
// ════════════════════════════════════════════════════
exports.updateUser = async (req, res) => {
  try {
    if (req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update password via this route.',
      });
    }

    const allowedFields = ['name', 'specialization', 'languages', 'role'];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await AuditLog.create({
      action:      'USER_UPDATED',
      performedBy: req.user._id,
      targetUser:  user._id,
      details:     `Updated user: ${user.email} — Fields: ${Object.keys(updates).join(', ')}`,
      ipAddress:   req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data:    user,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('❌ updateUser Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════
// @desc    Toggle user active/inactive  ← SINGLE definition
// @route   PATCH /api/users/:id/toggle-status
// @access  Private — super_admin
// ════════════════════════════════════════════════════
exports.toggleUserStatus = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    // ✅ 'USER_TOGGLED' — must match enum exactly
    await AuditLog.create({
      action:      'USER_TOGGLED',
      performedBy: req.user._id,
      targetUser:  user._id,
      details:     `${user.name} marked as ${user.isActive ? 'Active' : 'Inactive'}`,
      ipAddress:   req.ip,
    });

    res.status(200).json({
      success: true,
      message: `${user.name} is now ${user.isActive ? 'Active' : 'Inactive'}.`,
      data:    user,
    });

  } catch (err) {
    console.error('❌ toggleUserStatus Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


// ════════════════════════════════════════════════════
// @desc    Edit Mufti profile fields + optional pw reset
// @route   PATCH /api/users/:id/edit
// @access  Private — super_admin
// ════════════════════════════════════════════════════
exports.editMufti = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Mufti not found.' });
    }
    if (target.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super Admin accounts cannot be edited from here.',
      });
    }

    const { name, email, phone, specialization, languages } = req.body;
    const updates = {};
    if (name           !== undefined) updates.name           = name.trim();
    if (email          !== undefined) updates.email          = email.toLowerCase().trim();
    if (phone          !== undefined) updates.phone          = phone.trim();
    if (specialization !== undefined) updates.specialization = specialization.trim();
    if (languages      !== undefined) updates.languages      = languages;

    if (req.body.newPassword) {
      if (req.body.newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters.',
        });
      }
      const salt       = await bcrypt.genSalt(12);
      updates.password = await bcrypt.hash(req.body.newPassword, salt);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    await AuditLog.create({
      action:      'USER_UPDATED',
      performedBy: req.user._id,
      targetUser:  updated._id,
      details:     `Profile updated for ${updated.name} (${updated.email})`,
      ipAddress:   req.ip,
    });

    res.status(200).json({
      success: true,
      message: `${updated.name}'s profile has been updated.`,
      data:    updated,
    });
  } catch (err) {
    console.error('❌ editMufti Error:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════
// @desc    Delete user permanently  ← SINGLE definition
// @route   DELETE /api/users/:id
// @access  Private — super_admin
// ════════════════════════════════════════════════════
exports.deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (target.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super Admin accounts cannot be deleted.',
      });
    }

    // ✅ Audit log BEFORE delete — so the user ref still exists
    await AuditLog.create({
      action:      'USER_DELETED',
      performedBy: req.user._id,
      targetUser:  target._id,
      details:     `Mufti "${target.name}" (${target.email}) permanently deleted`,
      ipAddress:   req.ip,
    });

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `${target.name} has been permanently deleted.`,
    });
  } catch (err) {
    console.error('❌ deleteUser Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ════════════════════════════════════════════════════
// @desc    Get audit logs
// @route   GET /api/users/audit-logs
// @access  Private — super_admin
// ════════════════════════════════════════════════════
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, page = 1, limit = 30 } = req.query;

    const filter = {};
    if (action) filter.action = action;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skipNum  = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedBy',    'name email role')
        .populate('targetQuestion', 'questionText fatwaNumber')
        .populate('targetUser',     'name email role')   // ✅ added
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      count: logs.length,
      data:  logs,
    });
  } catch (err) {
    console.error('❌ getAuditLogs Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


// ════════════════════════════════════════════════════
// @desc    Register a new Mufti
// @route   POST /api/users/register
// @access  Private — super_admin only
// ════════════════════════════════════════════════════
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, specialization, languages } = req.body;

    // ── Validation ─────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // ── Check duplicate ────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    // ── Hash password ──────────────────────────────
    

    // ── Create ─────────────────────────────────────
    const newUser = await User.create({
  name: name.trim(),
  email: email.toLowerCase().trim(),
  password: password,      // ✅ Plain password
  role: "mufti",
  specialization: specialization || "",
  languages: languages || [],
  isActive: true,
});

    // ── Audit log ──────────────────────────────────
    await AuditLog.create({
      action:      'USER_CREATED',
      performedBy: req.user._id,
      targetUser:  newUser._id,
      details:     `New Mufti created: ${newUser.name} (${newUser.email})`,
      ipAddress:   req.ip,
    });

    const userOut = newUser.toObject();
    delete userOut.password;

    res.status(201).json({
      success: true,
      message: `${newUser.name} registered successfully as Mufti.`,
      data:    userOut,
    });

  } catch (err) {
    console.error('❌ registerUser Error:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

