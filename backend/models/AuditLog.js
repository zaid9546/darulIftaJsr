const mongoose = require('mongoose');

const AUDIT_ACTIONS = [
  // ── Question ──────────────────────────────────────
  'QUESTION_SUBMITTED',
  'QUESTION_ASSIGNED',
  'QUESTION_ANSWERED',
  'QUESTION_REVISION',
  'QUESTION_APPROVED',
  'QUESTION_REJECTED',
  'QUESTION_PUBLISHED',

  // ── User ──────────────────────────────────────────
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_TOGGLED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',

  // ── Auth ──────────────────────────────────────────
  'USER_LOGIN',
  'USER_LOGOUT',
  'PASSWORD_RESET',
];

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type:     String,
      required: true,
      enum:     {
        values:  AUDIT_ACTIONS,
        message: 'Invalid audit action: {VALUE}',   // shows the bad value in logs
      },
    },

    performedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    targetQuestion: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Question',
      default: null,
    },

    targetUser: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },

    details:   { type: String, default: '' },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

// ── Export action list too (use in controllers) ────────
auditLogSchema.statics.ACTIONS = AUDIT_ACTIONS.reduce((acc, a) => {
  acc[a] = a;
  return acc;
}, {});

module.exports = mongoose.model('AuditLog', auditLogSchema);
