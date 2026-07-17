import ModalWrapper  from './modals/ModalWrapper';
import ApprovalStamp from './ApprovalStamp';

const STATUS_CONFIG = {
  pending:   { label: '⏳ Pending',   color: '#854d0e', bg: '#fefce8' },
  assigned:  { label: '📋 Assigned',  color: '#1d4ed8', bg: '#eff6ff' },
  answered:  { label: '✍️ Answered',  color: '#15803d', bg: '#f0fdf4' },
  revision:  { label: '🔄 Revision',  color: '#c2410c', bg: '#fff7ed' },
  published: { label: '🌍 Published', color: '#065f46', bg: '#f0fdf4' },
  rejected:  { label: '❌ Rejected',  color: '#b91c1c', bg: '#fef2f2' },
};

const DetailModal = ({ question: q, onClose }) => {
  const cfg   = STATUS_CONFIG[q.status] || STATUS_CONFIG.pending;
  const isRTL = ['urdu', 'hindi'].includes(q.language);

  const fmtDate = (d) => d
    ? new Date(d).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  return (
    <ModalWrapper title="📄 Question Details" onClose={onClose} maxWidth="680px">

      {/* ── Status + Meta Row ──────────────────────── */}
      <div style={s.metaRow}>
        <span style={{ ...s.statusBadge, color: cfg.color, background: cfg.bg }}>
          {cfg.label}
        </span>
        <span style={s.metaItem}>🌍 {q.language}</span>
        <span style={s.metaItem}>📂 {q.category}</span>
        <span style={s.metaItem}>👁️ {q.views} views</span>
      </div>

      {/* ── Question ──────────────────────────────── */}
      <div style={s.section}>
        <p style={s.secLabel}>❓ Question</p>
        <p style={{
          ...s.qText,
          direction:  isRTL ? 'rtl' : 'ltr',
          textAlign:  isRTL ? 'right' : 'left',
          fontFamily: isRTL ? "'Noto Nastaliq Urdu', serif" : 'inherit',
          fontSize:   isRTL ? '17px' : '15px',
          lineHeight: isRTL ? '2.2' : '1.7',
        }}>
          {q.questionText}
        </p>
      </div>

      {/* ── Submitter Info ─────────────────────────── */}
      <div style={s.section}>
        <p style={s.secLabel}>👤 Submitter</p>
        {q.submittedBy?.isAnonymous ? (
          <p style={s.infoText}>🕵️ Anonymous submission</p>
        ) : (
          <div style={s.infoGrid}>
            {q.submittedBy?.name  && <InfoRow label="Name"  value={q.submittedBy.name} />}
            {q.submittedBy?.email && <InfoRow label="Email" value={q.submittedBy.email} />}
            {q.submittedBy?.phone && <InfoRow label="Phone" value={q.submittedBy.phone} />}
          </div>
        )}
        <p style={s.timestampText}>📅 Submitted: {fmtDate(q.createdAt)}</p>
      </div>

      {/* ── Assignment ─────────────────────────────── */}
      {q.assignedTo && (
        <div style={s.section}>
          <p style={s.secLabel}>📋 Assignment</p>
          <div style={s.infoGrid}>
            <InfoRow label="Assigned To"  value={q.assignedTo.name} />
            <InfoRow label="Assigned By"  value={q.assignedBy?.name || '—'} />
            <InfoRow label="Assigned At"  value={fmtDate(q.assignedAt)} />
          </div>
        </div>
      )}

      {/* ── Answer ─────────────────────────────────── */}
      {q.answer?.text && (
        <div style={s.section}>
          <p style={s.secLabel}>📜 Answer</p>
          <p style={{
            ...s.aText,
            direction:  isRTL ? 'rtl' : 'ltr',
            textAlign:  isRTL ? 'right' : 'left',
            fontFamily: isRTL ? "'Noto Nastaliq Urdu', serif" : 'inherit',
            fontSize:   isRTL ? '16px' : '14px',
            lineHeight: isRTL ? '2.2' : '1.7',
          }}>
            {q.answer.text}
          </p>
          {q.answer.references?.length > 0 && (
            <div style={s.refBox}>
              <strong style={s.refTitle}>📚 References:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                {q.answer.references.map((r, i) => (
                  <li key={i} style={{ fontSize: '12px', color: '#475569', marginBottom: '2px' }}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          <div style={s.infoGrid}>
            <InfoRow label="Answered By" value={q.answer.answeredBy?.name || '—'} />
            <InfoRow label="Answered At" value={fmtDate(q.answer.answeredAt)} />
          </div>
          {q.answer.revisionNote && (
            <div style={s.revNote}>
              🔄 <strong>Revision Note:</strong> {q.answer.revisionNote}
            </div>
          )}
        </div>
      )}

      {/* ── Tags ───────────────────────────────────── */}
      {q.tags?.length > 0 && (
        <div style={s.section}>
          <p style={s.secLabel}>🏷️ Tags</p>
          <div style={s.tagRow}>
            {q.tags.map((tag) => (
              <span key={tag} style={s.tag}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Approval Stamp ──────────────────────────── */}
      {q.approval?.isApproved && (
        <ApprovalStamp
          stampCode={q.approval.stampCode}
          fatwaNumber={q.fatwaNumber}
          fatwaDate={q.fatwaDate}
          approvedBy={q.approval.approvedBy?.name}
        />
      )}

      {/* ── Rejection Reason ────────────────────────── */}
      {q.status === 'rejected' && q.rejectionReason && (
        <div style={s.rejectBox}>
          <p style={s.secLabel}>❌ Rejection Reason</p>
          <p style={s.rejectText}>{q.rejectionReason}</p>
        </div>
      )}

      <button style={s.closeBtn} onClick={onClose}>Close</button>
    </ModalWrapper>
  );
};

// ── Small helper component ─────────────────────────────
const InfoRow = ({ label, value }) => (
  <div style={{ marginBottom: '6px' }}>
    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', display: 'block' }}>
      {label}
    </span>
    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
      {value}
    </span>
  </div>
);

const s = {
  metaRow:     { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' },
  statusBadge: { padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' },
  metaItem:    { fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '999px' },
  section:     { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' },
  secLabel:    { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' },
  qText:       { fontSize: '15px', color: '#1e293b', margin: 0 },
  aText:       { fontSize: '14px', color: '#374151', margin: '0 0 10px' },
  infoText:    { fontSize: '13px', color: '#64748b', fontStyle: 'italic', margin: '0 0 6px' },
  infoGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  timestampText:{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', marginBottom: 0 },
  refBox:      { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' },
  refTitle:    { fontSize: '12px', color: '#64748b' },
  revNote:     { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '13px', borderRadius: '8px', padding: '10px 12px', marginTop: '8px' },
  tagRow:      { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tag:         { background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', padding: '3px 10px', borderRadius: '999px', fontWeight: '600' },
  rejectBox:   { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' },
  rejectText:  { fontSize: '13px', color: '#991b1b', margin: 0, lineHeight: '1.5' },
  closeBtn:    { display: 'block', width: '100%', marginTop: '4px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#374151', padding: '11px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};

export default DetailModal;
