import { useState } from 'react';
import ModalWrapper  from './ModalWrapper';
import ApprovalStamp from '../ApprovalStamp';

const ApproveModal = ({
  question,
  actionLoading,
  approvalResult,
  onClose,
  onApprove,
}) => {
  const [notes,     setNotes]     = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const isRTL = ['urdu', 'hindi'].includes(question.language);

  // ── Post-approval: show stamp ──────────────────────
  if (approvalResult) {
    return (
      <ModalWrapper title="🎉 Fatwa Approved & Published!" onClose={onClose} maxWidth="600px">
        <p style={s.successMsg}>
          The question has been approved and is now publicly visible.
        </p>
        <ApprovalStamp
          stampCode={approvalResult.stampCode}
          fatwaNumber={approvalResult.fatwaNumber}
          fatwaDate={approvalResult.fatwaDate}
          approvedBy="You"
        />
        <button style={s.doneBtn} onClick={onClose}>
          ✅ Done
        </button>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper title="✅ Approve & Publish Fatwa" onClose={onClose} maxWidth="600px">

      {/* Question */}
      <div style={s.section}>
        <p style={s.sectionLabel}>❓ Question</p>
        <p style={{
          ...s.qText,
          direction:  isRTL ? 'rtl' : 'ltr',
          textAlign:  isRTL ? 'right' : 'left',
          fontFamily: isRTL ? "'Noto Nastaliq Urdu', serif" : 'inherit',
          fontSize:   isRTL ? '16px' : '14px',
          lineHeight: isRTL ? '2.2' : '1.6',
        }}>
          {question.questionText}
        </p>
      </div>

      {/* Answer */}
      <div style={s.section}>
        <p style={s.sectionLabel}>📜 Answer by {question.answer?.answeredBy?.name || 'Mufti'}</p>
        <p style={{
          ...s.aText,
          direction:  isRTL ? 'rtl' : 'ltr',
          textAlign:  isRTL ? 'right' : 'left',
          fontFamily: isRTL ? "'Noto Nastaliq Urdu', serif" : 'inherit',
          fontSize:   isRTL ? '15px' : '13px',
          lineHeight: isRTL ? '2.2' : '1.7',
        }}>
          {question.answer?.text || '—'}
        </p>

        {/* References */}
        {question.answer?.references?.length > 0 && (
          <div style={s.refList}>
            <p style={s.refTitle}>📚 References:</p>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {question.answer.references.map((ref, i) => (
                <li key={i} style={{ fontSize: '12px', color: '#475569', marginBottom: '2px' }}>
                  {ref}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Admin Notes */}
      <div style={s.field}>
        <label style={s.label}>📝 Approval Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any internal notes about this approval..."
          style={s.textarea}
          maxLength={500}
        />
        <span style={s.charCount}>{notes.length} / 500</span>
      </div>

      {/* Confirmation Checkbox */}
      <label style={s.confirmRow}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
        />
        <span style={s.confirmText}>
          I confirm this Fatwa is correct and ready for public publication.
          A unique Fatwa Number and Date will be generated automatically.
        </span>
      </label>

      {/* Action Buttons */}
      <div style={s.btnRow}>
        <button style={s.cancelBtn} onClick={onClose} disabled={actionLoading}>
          Cancel
        </button>
        <button
          style={{
            ...s.approveBtn,
            opacity: (!confirmed || actionLoading) ? 0.6 : 1,
          }}
          disabled={!confirmed || actionLoading}
          onClick={() => onApprove({ notes })}
        >
          {actionLoading ? '⏳ Processing...' : '✅ Approve & Publish'}
        </button>
      </div>
    </ModalWrapper>
  );
};

const s = {
  section:     { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' },
  sectionLabel:{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' },
  qText:       { fontSize: '14px', color: '#1e293b', margin: 0 },
  aText:       { fontSize: '13px', color: '#374151', margin: '0 0 10px' },
  refList:     { borderTop: '1px solid #e2e8f0', paddingTop: '10px' },
  refTitle:    { fontSize: '12px', fontWeight: '700', color: '#64748b', margin: '0 0 6px' },
  field:       { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
  label:       { fontSize: '13px', fontWeight: '600', color: '#374151' },
  textarea:    { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', minHeight: '80px', resize: 'vertical', outline: 'none', color: '#374151' },
  charCount:   { fontSize: '11px', color: '#94a3b8', textAlign: 'right' },
  confirmRow:  { display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', marginBottom: '20px', cursor: 'pointer' },
  confirmText: { fontSize: '13px', color: '#78350f', lineHeight: '1.5' },
  btnRow:      { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn:   { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  approveBtn:  { background: '#10b981', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  successMsg:  { color: '#065f46', fontSize: '15px', marginBottom: '20px', textAlign: 'center' },
  doneBtn:     { display: 'block', width: '100%', marginTop: '20px', background: '#10b981', color: '#fff', border: 'none', padding: '13px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
};

export default ApproveModal;
