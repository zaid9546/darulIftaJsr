import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance    from '../utils/axiosInstance';
import ApprovalStamp    from '../components/ApprovalStamp';
import DownloadPDFButton from '../components/DownloadPDFButton';

const FatwaDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [fatwa,   setFatwa]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const isRTL = ['urdu', 'hindi'].includes(fatwa?.language);

  // ── Fetch Fatwa ────────────────────────────────────
  useEffect(() => {
    const fetchFatwa = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/questions/public/${id}`);
        setFatwa(res.data.data);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'This Fatwa does not exist or has not been published yet.'
            : 'Failed to load Fatwa. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchFatwa();
  }, [id]);

  // ── Format date ────────────────────────────────────
  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

  // ── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.center}>
          <div style={s.spinner} />
          <p style={{ color: '#64748b' }}>Loading Fatwa...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────
  if (error) {
    return (
      <div style={s.page}>
        <div style={s.errorBox}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📭</div>
          <h2 style={{ color: '#b91c1c', margin: '0 0 8px' }}>Not Found</h2>
          <p style={{ color: '#64748b', margin: '0 0 24px' }}>{error}</p>
          <button style={s.backBtn} onClick={() => navigate('/fatwas')}>
            ← Back to Fatwas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* ── Breadcrumb ──────────────────────────── */}
        <div style={s.breadcrumb}>
          <button style={s.breadLink} onClick={() => navigate('/')}>Home</button>
          <span style={s.breadSep}>›</span>
          <button style={s.breadLink} onClick={() => navigate('/fatwas')}>Fatwas</button>
          <span style={s.breadSep}>›</span>
          <span style={s.breadCurrent}>{fatwa.fatwaNumber || 'Fatwa Detail'}</span>
        </div>

        {/* ── Main Card ───────────────────────────── */}
        <div style={s.card}>

          {/* ── Header ────────────────────────────── */}
          <div style={s.cardHeader}>
            <div style={s.headerLeft}>
              <h1 style={s.fatwaTitle}>
                {fatwa.fatwaNumber || 'Published Fatwa'}
              </h1>
              <div style={s.metaRow}>
                <span style={s.langBadge}>
                  {fatwa.language === 'urdu'  ? '🇵🇰 Urdu'
                   : fatwa.language === 'hindi' ? '🇮🇳 Hindi'
                   : '🇬🇧 English'}
                </span>
                <span style={s.catBadge}>{fatwa.category}</span>
                <span style={s.dateBadge}>🗓️ {fmtDate(fatwa.fatwaDate)}</span>
                <span style={s.viewsBadge}>👁️ {fatwa.views} views</span>
              </div>
            </div>

            {/* ── Download Buttons ──────────────────── */}
            <div style={s.downloadArea}>
              <DownloadPDFButton
                fatwaId={fatwa._id}
                fatwaNumber={fatwa.fatwaNumber}
                variant="download"
                size="md"
              />
            </div>
          </div>

          <div style={s.divider} />

          {/* ── Tags ────────────────────────────────── */}
          {fatwa.tags?.length > 0 && (
            <div style={s.tagsRow}>
              {fatwa.tags.map((tag) => (
                <span key={tag} style={s.tag}>#{tag}</span>
              ))}
            </div>
          )}

          {/* ── Question ─────────────────────────────── */}
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <span style={s.sectionAccent} />
              <h2 style={s.sectionTitle}>❓ Question</h2>
            </div>
            <div
              style={{
                ...s.questionBox,
                direction:  isRTL ? 'rtl' : 'ltr',
                textAlign:  isRTL ? 'right' : 'left',
                fontFamily: isRTL ? "'Noto Nastaliq Urdu', serif" : 'inherit',
                fontSize:   isRTL ? '20px' : '17px',
                lineHeight: isRTL ? '2.4' : '1.7',
              }}
            >
              {fatwa.questionText}
            </div>
          </section>

          {/* ── Answer ───────────────────────────────── */}
          {fatwa.answer?.text && (
            <section style={s.section}>
              <div style={s.sectionHeader}>
                <span style={{ ...s.sectionAccent, background: '#059669' }} />
                <h2 style={s.sectionTitle}>📜 Answer & Ruling</h2>
              </div>
              <div style={s.answerBox}>
                <div
                  style={{
                    ...s.answerText,
                    direction:  isRTL ? 'rtl' : 'ltr',
                    textAlign:  isRTL ? 'right' : 'left',
                    fontFamily: isRTL ? "'Noto Nastaliq Urdu', serif" : 'inherit',
                    fontSize:   isRTL ? '18px' : '16px',
                    lineHeight: isRTL ? '2.4' : '1.8',
                  }}
                >
                  {fatwa.answer.text}
                </div>

                {/* ── Mufti Credit ─────────────────── */}
                {fatwa.answer.answeredBy && (
                  <div style={s.muftiCredit}>
                    <div style={s.muftiAvatar}>
                      {fatwa.answer.answeredBy.name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div>
                      <p style={s.muftiName}>{fatwa.answer.answeredBy.name}</p>
                      {fatwa.answer.answeredBy.specialization && (
                        <p style={s.muftiSpec}>{fatwa.answer.answeredBy.specialization}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── References ───────────────────────────── */}
          {fatwa.answer?.references?.length > 0 && (
            <section style={s.section}>
              <div style={s.sectionHeader}>
                <span style={{ ...s.sectionAccent, background: '#7c3aed' }} />
                <h2 style={s.sectionTitle}>📚 References</h2>
              </div>
              <ul style={s.refList}>
                {fatwa.answer.references.map((ref, i) => (
                  <li key={i} style={s.refItem}>
                    <span style={s.refNum}>{i + 1}</span>
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Approval Stamp ───────────────────────── */}
          {fatwa.approval?.isApproved && (
            <section style={s.section}>
              <div style={s.sectionHeader}>
                <span style={{ ...s.sectionAccent, background: '#047857' }} />
                <h2 style={s.sectionTitle}>🔐 Official Approval Stamp</h2>
              </div>
              <ApprovalStamp
                stampCode={fatwa.approval.stampCode}
                fatwaNumber={fatwa.fatwaNumber}
                fatwaDate={fatwa.fatwaDate}
                approvedBy={fatwa.approval.approvedBy?.name}
              />
            </section>
          )}

          {/* ── Bottom Download CTA ──────────────────── */}
          <div style={s.downloadCTA}>
            <div style={s.ctaLeft}>
              <p style={s.ctaTitle}>📄 Download Official PDF</p>
              <p style={s.ctaSubtitle}>
                Get a printable version of this Fatwa with the official stamp
              </p>
            </div>
            <DownloadPDFButton
              fatwaId={fatwa._id}
              fatwaNumber={fatwa.fatwaNumber}
              variant="download"
              size="lg"
            />
          </div>
        </div>

        {/* ── Navigation ──────────────────────────── */}
        <div style={s.navRow}>
          <button style={s.navBtn} onClick={() => navigate('/fatwas')}>
            ← Back to All Fatwas
          </button>
        </div>
      </div>
    </div>
  );
};

const s = {
  page:          { minHeight: '100vh', background: '#f8fafc', padding: '32px 20px' },
  container:     { maxWidth: '860px', margin: '0 auto' },
  center:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' },
  spinner:       { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorBox:      { textAlign: 'center', padding: '80px 20px' },
  backBtn:       { background: '#10b981', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  breadcrumb:    { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px' },
  breadLink:     { background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: '600', padding: 0 },
  breadSep:      { color: '#94a3b8' },
  breadCurrent:  { color: '#64748b' },
  card:          { background: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' },
  cardHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' },
  headerLeft:    { flex: 1 },
  fatwaTitle:    { fontSize: '24px', fontWeight: '800', color: '#065f46', margin: '0 0 12px', fontFamily: 'monospace' },
  metaRow:       { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  langBadge:     { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  catBadge:      { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  dateBadge:     { background: '#f0fdf4', color: '#065f46', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  viewsBadge:    { fontSize: '12px', color: '#94a3b8' },
  downloadArea:  { flexShrink: 0 },
  divider:       { height: '1px', background: '#f1f5f9', margin: '0 0 24px' },
  tagsRow:       { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' },
  tag:           { background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', padding: '3px 10px', borderRadius: '999px', fontWeight: '600' },
  section:       { marginBottom: '32px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  sectionAccent: { width: '4px', height: '22px', borderRadius: '2px', background: '#065f46', flexShrink: 0 },
  sectionTitle:  { fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 },
  questionBox:   { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', fontSize: '17px', color: '#1e293b' },
  answerBox:     { background: '#fff', border: '1px solid #d1fae5', borderRadius: '12px', padding: '24px', borderLeft: '4px solid #10b981' },
  answerText:    { fontSize: '16px', color: '#1e293b', margin: '0 0 20px' },
  muftiCredit:   { display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' },
  muftiAvatar:   { width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', flexShrink: 0 },
  muftiName:     { fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px' },
  muftiSpec:     { fontSize: '12px', color: '#64748b', margin: 0, fontStyle: 'italic' },
  refList:       { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  refItem:       { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#374151' },
  refNum:        { background: '#7c3aed', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
  downloadCTA:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px 24px', marginTop: '32px', gap: '20px', flexWrap: 'wrap' },
  ctaLeft:       { flex: 1 },
  ctaTitle:      { fontSize: '16px', fontWeight: '700', color: '#065f46', margin: '0 0 4px' },
  ctaSubtitle:   { fontSize: '13px', color: '#4b7c5e', margin: 0 },
  navRow:        { display: 'flex', justifyContent: 'flex-start', marginTop: '24px' },
  navBtn:        { background: 'none', border: '1.5px solid #e2e8f0', color: '#475569', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
};

export default FatwaDetail;
