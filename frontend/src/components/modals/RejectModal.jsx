import { useState } from 'react';
import ModalWrapper  from './ModalWrapper';

const RejectModal = ({ question, actionLoading, onClose, onReject }) => {
  const [reason, setReason] = useState('');

  const QUICK_REASONS = [
    'Question is not related to Islamic jurisprudence.',
    'Question contains inappropriate or offensive content.',
    'Duplicate of an already published Fatwa.',
    'Insufficient detail to provide a ruling.',
    'Question falls outside our scope of service.',
  ];

  return (
    <ModalWrapper title="❌ Reject Question" onClose={onClose}>

      {/* Warning Banner */}
      <div style={s.warnBox}>
        ⚠️ Rejecting this question will mark it as <strong>rejected</strong> and
        it will <strong>not</strong> be published publicly. This action can be
        reviewed in the Audit Log.
      </div>

      {/* Question Preview */}
      <div style={s.qBox}>
        <p style={s.qLabel}>Question Preview</p>
        <p style={s.qText}>
          {question.questionText.length > 200
            ? question.questionText.slice(0, 200) + '...'
            : question.questionText}
        </p>
      </div>

      {/* Quick Reason Buttons */}
      <div style={s.field}>
        <label style={s.label}>⚡ Quick Reasons</label>
        <div style={s.quickList}>
          {QUICK_REASONS.map((r) => (
            <button
              key={r}
              style={{
                ...s.quickBtn,
                ...(reason === r ? s.quickBtnActive : {}),
              }}
              type="button"
              onClick={() => setReason(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Reason */}
      <div style={s.field}>
        <label style={s.label}>📝 Rejection Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a clear reason for rejection..."
          style={s.textarea}
          minLength={5}
          maxLength={500}
          required
        />
        <span style={s.charCount}>{reason.length} / 500</span>
      </div>

      {/* Buttons */}
      <div style={s.btnRow}>
        <button style={s.cancelBtn} onClick={onClose} disabled={actionLoading}>
          Cancel
        </button>
        <button
          style={{
            ...s.rejectBtn,
            opacity: (reason.trim().length < 5 || actionLoading) ? 0.6 : 1,
          }}
          disabled={reason.trim().length < 5 || actionLoading}
          onClick={() => onReject({ rejectionReason: reason.trim() })}
        >
          {actionLoading ? '⏳ Rejecting...' : '❌ Confirm Rejection'}
        </button>
      </div>
    </ModalWrapper>
  );
};

const s = {
  warnBox:       { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' },
  qBox:          { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' },
  qLabel:        { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 6px' },
  qText:         { fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5' },
  field:         { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
  label:         { fontSize: '13px', fontWeight: '600', color: '#374151' },
  quickList:     { display: 'flex', flexDirection: 'column', gap: '6px' },
  quickBtn:      { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', textAlign: 'left', transition: 'all 0.15s' },
  quickBtnActive:{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', fontWeight: '600' },
  textarea:      { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', minHeight: '90px', resize: 'vertical', outline: 'none', color: '#374151' },
  charCount:     { fontSize: '11px', color: '#94a3b8', textAlign: 'right' },
  btnRow:        { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn:     { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  rejectBtn:     { background: '#ef4444', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
};

export default RejectModal;
