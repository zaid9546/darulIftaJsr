const mongoose = require("mongoose");
const crypto = require("crypto");

// ── Sub-schema: Submitter Info ───────────────────────
const submittedBySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    isAnonymous: { type: Boolean, default: false },
  },
  { _id: false }, // No separate _id for sub-documents
);

// ── Sub-schema: Answer ───────────────────────────────
const answerSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
    },
    references: {
      type: [String], // e.g., Quran verses, Hadith references
      default: [],
    },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    answeredAt: { type: Date },
    revisionNote: { type: String, trim: true }, // Note from super_admin on revision request
  },
  { _id: false },
);

// ── Sub-schema: Approval ─────────────────────────────
const approvalSchema = new mongoose.Schema(
  {
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    stampCode: { type: String }, // Auto-generated digital stamp
    notes: { type: String, trim: true },
  },
  { _id: false },
);

// ── Main Question Schema ─────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    // ── Question Content ──────────────────────────────
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      minlength: [10, "Question must be at least 10 characters"],
      maxlength: [5000, "Question must not exceed 5000 characters"],
    },
    language: {
      type: String,
      required: [true, "Language is required"],
      enum: {
        values: ["urdu", "hindi", "english"],
        message: "Language must be urdu, hindi, or english",
      },
      default: "english",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "prayer",
          "fasting",
          "zakat",
          "hajj",
          "marriage",
          "divorce",
          "finance",
          "food",
          "worship",
          "other",
        ],
        message: "Invalid category",
      },
      default: "other",
    },

    // ── Submitter Info ────────────────────────────────
    submittedBy: {
      type: submittedBySchema,
      default: () => ({ isAnonymous: true }),
    },

    // ── Lifecycle Status ──────────────────────────────
    status: {
      type: String,
      enum: {
        values: [
          "pending", // Newly submitted
          "assigned", // Assigned to a Mufti
          "answered", // Mufti has submitted an answer
          "revision", // Super Admin requests revision
          "approved", // Super Admin approved (internal)
          "published", // Publicly visible
          "rejected", // Rejected, not published
        ],
        message: "Invalid status",
      },
      default: "pending",
    },

    // ── Assignment Info ───────────────────────────────
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Super Admin
    },
    assignedAt: { type: Date },

    // ── Answer & Approval ────────────────────────────
    answer: { type: answerSchema, default: () => ({}) },
    approval: { type: approvalSchema, default: () => ({}) },

    // ── Fatwa Metadata (set ONLY at approval time) ────
    fatwaNumber: {
      type: String,
      sparse: true, // Allow null; enforce unique only when set
    },
    fatwaDate: {
      type: Date, // Server UTC time at moment of approval
    },

    // ── Visibility & Engagement ───────────────────────
    isPublic: { type: Boolean, default: false },
    publishedAt: { type: Date },
    views: { type: Number, default: 0 },
    tags: {
      type: [String],
      default: [],
    },

    // ── Rejection Info ────────────────────────────────
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// ── Instance Method: Generate Digital Stamp Code ─────
questionSchema.methods.generateStampCode = function () {
  // Combines question ID + current timestamp → SHA-256 hash (first 12 chars)
  const raw = `${this._id}-${Date.now()}`;
  return (
    "STAMP-" +
    crypto
      .createHash("sha256")
      .update(raw)
      .digest("hex")
      .slice(0, 12)
      .toUpperCase()
  );
  // e.g., STAMP-3F9A2B1C4E7D
};

// ── Indexes ───────────────────────────────────────────
questionSchema.index({ fatwaNumber: 1 }, { unique: true, sparse: true }); // Unique Fatwa Number
questionSchema.index({ status: 1 }); // Filter by status
questionSchema.index({ language: 1 }); // Filter by language
questionSchema.index({ isPublic: 1, publishedAt: -1 }); // Public feed (sorted)
questionSchema.index({ assignedTo: 1, status: 1 }); // Mufti dashboard
questionSchema.index({ "approval.approvedBy": 1 }); // Admin audit queries
questionSchema.index({ tags: 1 }); // Tag-based search
questionSchema.index({
  questionText: "text",
  "answer.text": "text",
  tags: "text",
}); // Full-text search

module.exports = mongoose.model("Question", questionSchema);
