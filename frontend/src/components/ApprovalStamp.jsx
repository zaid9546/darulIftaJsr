const ApprovalStamp = ({ stampCode, fatwaNumber, fatwaDate, approvedBy }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  return (
    <div style={s.stampWrapper}>
      {/* ── Stamp Border ────────────────────────────── */}
      <div style={s.stamp}>
        {/* ── Top Header ────────────────────────────── */}
        <div style={s.stampHeader}>
          <span style={s.stampIcon}>🕌</span>
          <span style={s.stampTitle}>OFFICIAL FATWA STAMP</span>
          <span style={s.stampIcon}>🕌</span>
        </div>

        <div style={s.divider} />

        {/* ── Fatwa Number ──────────────────────────── */}
        <div style={s.mainNumber}>{fatwaNumber || '—'}</div>

        <div style={s.divider} />

        {/* ── Details Grid ──────────────────────────── */}
        <div style={s.detailGrid}>
          <div style={s.detailItem}>
            <span style={s.detailLabel}>📅 FATWA DATE</span>
            <span style={s.detailValue}>{formatDate(fatwaDate)}</span>
          </div>
          {approvedBy && (
            <div style={s.detailItem}>
              <span style={s.detailLabel}>✅ APPROVED BY Darulifta Jamshedpur</span>
              {/* <span style={s.detailValue}>{approvedBy}</span> */}
            </div>
          )}
          {stampCode && (
            <div style={{ ...s.detailItem, gridColumn: '1 / -1' }}>
              <span style={s.detailLabel}>🔐 STAMP CODE</span>
              <code style={s.stampCode}>{stampCode}</code>
            </div>
          )}
        </div>

        {/* ── Footer Note ───────────────────────────── */}
        <div style={s.stampFooter}>
          ✦ This Fatwa has been reviewed and approved by the Darulifta Jamshedpur ✦
        </div>
      </div>
    </div>
  );
};

const s = {
  stampWrapper: { display: 'flex', justifyContent: 'center', margin: '8px 0' },
  stamp: {
    border:       '3px solid #059669',
    borderRadius: '12px',
    padding:      '20px 28px',
    width:        '100%',
    maxWidth:     '520px',
    background:   'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
    position:     'relative',
    boxShadow:    '0 4px 16px rgba(5,150,105,0.15)',
    outline:      '1px dashed #6ee7b7',
    outlineOffset:'4px',
  },
  stampHeader: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   '10px',
  },
  stampIcon:  { fontSize: '20px' },
  stampTitle: { fontSize: '13px', fontWeight: '800', color: '#065f46', letterSpacing: '0.12em', textTransform: 'uppercase' },
  divider:    { height: '1px', background: '#a7f3d0', margin: '10px 0' },
  mainNumber: { textAlign: 'center', fontSize: '22px', fontWeight: '900', color: '#047857', letterSpacing: '0.08em', padding: '8px 0', fontFamily: 'monospace' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel:{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' },
  detailValue:{ fontSize: '14px', fontWeight: '600', color: '#065f46' },
  stampCode:  { fontSize: '12px', fontFamily: 'monospace', color: '#047857', background: '#d1fae5', padding: '4px 8px', borderRadius: '4px', wordBreak: 'break-all' },
  stampFooter:{ textAlign: 'center', marginTop: '14px', fontSize: '10px', color: '#6b7280', letterSpacing: '0.05em', fontStyle: 'italic' },
};

export default ApprovalStamp;
