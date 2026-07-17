const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name must not exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries
    },

    // ── Role & Access ───────────────────────────────
    role: {
      type: String,
      enum: {
        values: ["super_admin", "mufti"],
        message: "Role must be either super_admin or mufti",
      },
      default: "mufti",
    },
    isActive: {
      type: Boolean,
      default: true, // Admin can deactivate a user
    },

    // ── Mufti-specific Fields ───────────────────────
    specialization: {
      type: String,
      trim: true,
      maxlength: [200, "Specialization must not exceed 200 characters"],
    },
    languages: {
      type: [String],
      enum: {
        values: ["urdu", "hindi", "english", "arabic"],
        message: "Language must be urdu, hindi, or english",
      },
      default: ["english"],
    },
    profileId: {
      type: String,
      unique: true,
      sparse: true, // allows null until generated
      trim: true,
    },
    profileIdCustom: {
      type: String, // user-editable custom ID (display name style)
      trim: true,
      default: "",
    },
    avatar: {
      type: String, // URL or base64 for future use
      default: "",
    },
    lastLogin: {
      type: Date,
      default: null,
    },

    // ── Password Reset (for future use) ─────────────
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// ── Auto-generate profileId before first save ────────
userSchema.pre("save", async function (next) {
  if (!this.profileId) {
    const { generateProfileId } = require("../utils/profileIdGenerator");
    let id;
    let attempts = 0;
    // retry loop to guarantee uniqueness
    do {
      id = generateProfileId(this.role);
      attempts++;
    } while (
      attempts < 10 &&
      (await mongoose.model("User").exists({ profileId: id }))
    );
    this.profileId = id;
  }
  next();
});

// ── Pre-save Hook: Hash password before saving ──────
userSchema.pre("save", async function (next) {
  // Only hash if password was modified
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Method: Compare entered password ───────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Index: Fast lookup by email ─────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.model("User", userSchema);
