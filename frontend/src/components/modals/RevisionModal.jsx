import { useState } from 'react';
import ModalWrapper  from './ModalWrapper';

const RevisionModal = ({ question, actionLoading, onClose, onRevision }) => {
  const [note, setNote] = useState('');

  const QUICK_NOTES = [
    'Please add Quranic references to support the ruling.',
    'The answer needs more detail on the specific conditions.',
    'Please clarify the ruling for different madhabs.',
    'References cited appear incorrect — please verify.',
    'Answer is too brief. Please expand with more explanation.',
  ];

  return (
    <ModalWrapper title="🔄 Request Revision" onClose={onClose}>

      {/* Info Banner */}
      <div style={s.infoBox}>
        🔄 This question will be sent back to the assigned Mufti
        with your revision note. The status will change to <strong>revision</strong>.
      </div>

      {/* Mufti Info */}
      {question.assignedTo && (
        <div style={s.muftiBox}>
          <span style={s.muftiLabel}>📋 Assigned Mufti:</span>
          <span style={s.muftiName}>{question.assignedTo.name}</span>
        </div>
      )}

      {/* Quick Notes */}
      <div style={s.field}>
        <label style={s.label}>⚡ Quick Notes</label>
        <div style={s.quickList}>
          {QUICK_NOTES.map((n) => (
            <button
              key={n}
              type="button"
              style={{
                ...s.quickBtn,
                ...(note === n ? s.quickBtnActive : {}),
              }}
              onClick={() => setNote(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Note */}
      <div style={s.field}>
        <label style={s.label}>📝 Revision Note for Mufti</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Explain what changes are needed..."
          style={s.textarea}
          minLength={5}
          maxLength={500}
          required
        />
        <span style={s.charCount}>{note.length} / 500</span>
      </div>

      {/* Buttons */}
      <div style={s.btnRow}>
        <button style={s.cancelBtn} onClick={onClose} disabled={actionLoading}>
          Cancel
        </button>
        <button
          style={{
            ...s.reviseBtn,
            opacity: (note.trim().length < 5 || actionLoading) ? 0.6 : 1,
          }}
          disabled={note.trim().length < 5 || actionLoading}
          onClick={() => onRevision({ revisionNote: note.trim() })}
        >
          {actionLoading ? '⏳ Sending...' : '🔄 Send for Revision'}
        </button>
      </div>
    </ModalWrapper>
  );
};

const s = {
  infoBox:       { background: '#fffbeb', border: '1px solid #fde68a', color: '#78350f', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' },
  muftiBox:      { display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' },
  muftiLabel:    { fontSize: '12px', fontWeight: '700', color: '#1d4ed8' },
  muftiName:     { fontSize: '14px', fontWeight: '600', color: '#1e293b' },
  field:         { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
  label:         { fontSize: '13px', fontWeight: '600', color: '#374151' },
  quickList:     { display: 'flex', flexDirection: 'column', gap: '6px' },
  quickBtn:      { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', textAlign: 'left', transition: 'all 0.15s' },
  quickBtnActive:{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e', fontWeight: '600' },
  textarea:      { padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', minHeight: '90px', resize: 'vertical', outline: 'none', color: '#374151' },
  charCount:     { fontSize: '11px', color: '#94a3b8', textAlign: 'right' },
  btnRow:        { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn:     { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  reviseBtn:     { background: '#f59e0b', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
};

export default RevisionModal;
