const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const AuditLog = require('../models/AuditLog');
const bcrypt   = require("bcryptjs");
const crypto   = require("crypto");

// ════════════════════════════════════════════════════
//  HELPER: Sign JWT Token
// ════════════════════════════════════════════════════
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ════════════════════════════════════════════════════
//  HELPER: Send Token Response (cookie + JSON)
// ════════════════════════════════════════════════════
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    sameSite: "strict",
    secure:   process.env.NODE_ENV === "production",
  };

  // Never send password in response
  user.password = undefined;

  res
    .status(statusCode)
    .cookie("jwt", token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        _id:             user._id,
        name:            user.name,
        email:           user.email,
        role:            user.role,
        isActive:        user.isActive,
        specialization:  user.specialization,
        languages:       user.languages,
        profileId:       user.profileId,
        profileIdCustom: user.profileIdCustom,
        bio:             user.bio,
        avatar:          user.avatar,
        lastLogin:       user.lastLogin,
        createdAt:       user.createdAt,
      },
    });
};

// ════════════════════════════════════════════════════
// @desc    Register a new user (mufti or super_admin)
// @route   POST /api/auth/register
// @access  Private (super_admin only)
// ════════════════════════════════════════════════════
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, specialization, languages } = req.body;
    console.log("REGISTER BODY:", req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    // Create user — password is hashed by pre-save hook in User model
    const user = await User.create({
      name,
      email,
      password,
      role:           role           || 'mufti',
      specialization: specialization || '',
      languages:      languages      || ['english'],
    });

    // Audit log
    await AuditLog.create({
      action:      'USER_REGISTERED',
      performedBy: user._id,
      details:     `New user registered: ${user.email} as ${user.role}`,
      ipAddress:   req.ip,
      userAgent:   req.headers['user-agent'],
    });

    sendTokenResponse(user, 201, res);

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('❌ Register Error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ════════════════════════════════════════════════════
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ════════════════════════════════════════════════════
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validate input ────────────────────────────────
    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });

    // ── Find user — MUST include password for bcrypt.compare ──
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password'); // ✅ required when schema has select: false

    if (!user)
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });

    if (!user.isActive)
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact admin.",
      });

    // ── Compare password ──────────────────────────────

    // ── Compare password (DEBUG) ──────────────────────
console.log("════════ LOGIN DEBUG ════════");
console.log("Email Entered:", email);
console.log("Password Entered:", password);

console.log("User Found:", !!user);
console.log("DB Email:", user.email);
console.log("DB Hash:", user.password);

const isMatch = await bcrypt.compare(password, user.password);

console.log("Password Match:", isMatch);
console.log("═════════════════════════════");

if (!isMatch)
  return res.status(401).json({
    success: false,
    message: "Invalid email or password.",
  });

    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch)
    //   return res.status(401).json({
    //     success: false,
    //     message: "Invalid email or password.",
    //   });

    // ── Update lastLogin ──────────────────────────────
    user.lastLogin = new Date();

    // ── Generate profileId for older accounts ─────────
    if (!user.profileId) {
      const { generateProfileId } = require("../utils/profileIdGenerator");
      user.profileId = generateProfileId(user.role);
    }

    await user.save();

    // ── Send token + user data ────────────────────────
    sendTokenResponse(user, 200, res);

  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


// ════════════════════════════════════════════════════
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
// ════════════════════════════════════════════════════
exports.logout = async (req, res) => {
  try {
    await AuditLog.create({
      action:      'USER_LOGOUT',
      performedBy: req.user._id,
      details:     `User logged out: ${req.user.email}`,
      ipAddress:   req.ip,
      userAgent:   req.headers['user-agent'],
    });

    res
      .cookie('jwt', 'loggedout', {
        expires:  new Date(Date.now() + 1000), // 1 second
        httpOnly: true,
        sameSite: 'strict',
        secure:   process.env.NODE_ENV === 'production',
      })
      .status(200)
      .json({ success: true, message: 'Logged out successfully.' });

  } catch (err) {
    console.error('❌ Logout Error:', err);
    res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
};

// ════════════════════════════════════════════════════
// @desc    Get logged-in user profile
// @route   GET /api/auth/me
// @access  Private
// ════════════════════════════════════════════════════
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user)
      return res.status(404).json({ success: false, message: "User not found." });

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("❌ getMe Error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════
// @desc    Update own profile
// @route   PATCH /api/auth/profile
// @access  Private (all roles)
// ════════════════════════════════════════════════════
exports.updateProfile = async (req, res) => {
  try {
    // ── Fields any user can update ─────────────────────
    const allowedFields = ['name', 'specialization', 'languages'];

    // ── Super Admin can also update email ──────────────
    if (req.user.role === 'super_admin') {
      allowedFields.push('email');
    }

    // ── Build sanitized update object ──────────────────
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // ── Handle password change separately ──────────────
    if (req.body.currentPassword && req.body.newPassword) {
      // Fetch user WITH password for comparison
      const userWithPw = await User.findById(req.user._id).select('+password');

      const isMatch = await bcrypt.compare(
        req.body.currentPassword,
        userWithPw.password
      );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      if (req.body.newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters.',
        });
      }

      // Hash new password manually (bypasses pre-save if using findByIdAndUpdate)
      const salt        = await bcrypt.genSalt(12);
      updates.password  = await bcrypt.hash(req.body.newPassword, salt);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update.',
      });
    }

    // ── Perform update ─────────────────────────────────
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user:    updatedUser,
    });

  } catch (err) {
    console.error('❌ Update Profile Error:', err.message);

    // Handle duplicate email
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This email is already in use.',
      });
    }

    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


// ════════════════════════════════════════════════════
// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
// ════════════════════════════════════════════════════
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success — do NOT reveal if email exists (security)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email exists, a reset link has been sent.",
      });
    }

    // Generate secure token
    const rawToken    = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    // Log for dev — replace with nodemailer in production
    console.log(`\n🔑 PASSWORD RESET LINK for ${user.email}:\n${resetURL}\n`);

    res.status(200).json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
      // Remove devResetURL in production:
      devResetURL: process.env.NODE_ENV === "development" ? resetURL : undefined,
    });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ════════════════════════════════════════════════════
// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ════════════════════════════════════════════════════
exports.resetPassword = async (req, res) => {
  try {
    const { token }    = req.params;
    const { password } = req.body;

    if (!password || password.length < 8)
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: new Date() }, // not expired
    });

    if (!user)
      return res.status(400).json({ success: false, message: "Reset link is invalid or has expired." });

    // Assign plain password — pre-save hook will hash it automatically
    user.password             = password;
    user.resetPasswordToken   = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
