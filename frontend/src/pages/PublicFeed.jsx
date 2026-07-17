import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector }          from 'react-redux';
import {
  fetchPublicFeed,
  selectPublicFeed,
  selectFeedPagination,
  selectQLoading,
  selectQError,
} from '../features/questions/questionSlice';
import ApprovalStamp from '../components/ApprovalStamp';

const STATUS_COLOR = {
  urdu:    '#7c3aed',
  hindi:   '#dc2626',
  english: '#2563eb',
};

const PublicFeed = () => {
  const dispatch    = useDispatch();
  const fatwas      = useSelector(selectPublicFeed);
  const pagination  = useSelector(selectFeedPagination);
  const loading     = useSelector(selectQLoading);
  const error       = useSelector(selectQError);

  const [filters, setFilters] = useState({
    search:   '',
    language: '',
    category: '',
    page:     1,
    limit:    10,
  });

  const [expandedId, setExpandedId] = useState(null);

  // ── Fetch on filter change ─────────────────────────
  const loadFeed = useCallback(() => {
    const params = {};
    if (filters.search)   params.search   = filters.search;
    if (filters.language) params.language = filters.language;
    if (filters.category) params.category = filters.category;
    params.page  = filters.page;
    params.limit = filters.limit;
    dispatch(fetchPublicFeed(params));
  }, [dispatch, filters]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  return (
    <div style={s.page}>

      {/* ── Page Header ─────────────────────────────── */}
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>📖 Published Fatwas</h1>
        <p style={s.pageSubtitle}>
          Browse verified Islamic rulings from qualified Muftis
        </p>
      </div>

      {/* ── Filters Bar ─────────────────────────────── */}
      <div style={s.filterBar}>
        <input
          type="text"
          placeholder="🔍 Search fatwas..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={s.searchInput}
        />
        <select
          value={filters.language}
          onChange={(e) => handleFilterChange('language', e.target.value)}
          style={s.filterSelect}
        >
          <option value="">🌍 All Languages</option>
          <option value="english">🇬🇧 English</option>
          <option value="urdu">🇵🇰 Urdu</option>
          <option value="hindi">🇮🇳 Hindi</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          style={s.filterSelect}
        >
          <option value="">📂 All Categories</option>
          <option value="prayer">🕌 Prayer</option>
          <option value="fasting">🌙 Fasting</option>
          <option value="zakat">💰 Zakat</option>
          <option value="hajj">🕋 Hajj</option>
          <option value="marriage">💍 Marriage</option>
          <option value="divorce">📜 Divorce</option>
          <option value="finance">🏦 Finance</option>
          <option value="food">🍽️ Food</option>
          <option value="worship">📿 Worship</option>
          <option value="other">❓ Other</option>
        </select>
        {(filters.search || filters.language || filters.category) && (
          <button
            style={s.clearBtn}
            onClick={() => setFilters({ search: '', language: '', category: '', page: 1, limit: 10 })}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Stats Bar ───────────────────────────────── */}
      {pagination && (
        <div style={s.statsBar}>
          📊 Showing <strong>{fatwas.length}</strong> of{' '}
          <strong>{pagination.total}</strong> published Fatwas
        </div>
      )}

      {/* ── Loading ──────────────────────────────────── */}
      {loading && (
        <div style={s.center}>
          <div style={s.spinner} /> Loading Fatwas...
        </div>
      )}

      {/* ── Error ────────────────────────────────────── */}
      {error && !loading && (
        <div style={s.errorBox}>⚠️ {error}</div>
      )}

      {/* ── Empty State ──────────────────────────────── */}
      {!loading && !error && fatwas.length === 0 && (
        <div style={s.emptyState}>
          <div style={{ fontSize: '64px' }}>🔍</div>
          <h3>No Fatwas Found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {/* ── Fatwa Cards ──────────────────────────────── */}
      <div style={s.feedList}>
        {fatwas.map((fatwa) => {
          const isExpanded = expandedId === fatwa._id;
          const isRTL = ['urdu', 'hindi'].includes(fatwa.language);

          return (
            <div key={fatwa._id} style={s.card}>

              {/* ── Card Header ──────────────────────── */}
              <div style={s.cardHeader}>
                <div style={s.cardMeta}>
                  <span style={{
                    ...s.langBadge,
                    background: STATUS_COLOR[fatwa.language] + '15',
                    color:      STATUS_COLOR[fatwa.language],
                    border:     `1px solid ${STATUS_COLOR[fatwa.language]}30`,
                  }}>
                    {fatwa.language === 'urdu' ? '🇵🇰 Urdu'
                     : fatwa.language === 'hindi' ? '🇮🇳 Hindi'
                     : '🇬🇧 English'}
                  </span>
                  <span style={s.catBadge}>
                    {fatwa.category}
                  </span>
                  <span style={s.viewCount}>👁️ {fatwa.views}</span>
                </div>

                {/* ── Fatwa Number + Date ───────────── */}
                {fatwa.fatwaNumber && (
                  <div style={s.fatwaMeta}>
                    <span style={s.fatwaNumber}>📋 {fatwa.fatwaNumber}</span>
                    <span style={s.fatwaDate}>
                      🗓️ {formatDate(fatwa.fatwaDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Question Text ─────────────────────── */}
              <div
                style={{
                  ...s.questionText,
                  direction:  isRTL ? 'rtl' : 'ltr',
                  textAlign:  isRTL ? 'right' : 'left',
                  fontFamily: isRTL
                    ? "'Noto Nastaliq Urdu', serif"
                    : 'inherit',
                  fontSize:   isRTL ? '17px' : '16px',
                  lineHeight: isRTL ? '2.2' : '1.6',
                }}
              >
                ❓ {fatwa.questionText}
              </div>

              {/* ── Expand / Collapse ─────────────────── */}
              <button
                style={s.expandBtn}
                onClick={() =>
                  setExpandedId(isExpanded ? null : fatwa._id)
                }
              >
                {isExpanded ? '▲ Hide Answer' : '▼ View Answer & Stamp'}
              </button>

              {/* ── Expanded: Answer + Stamp ──────────── */}
              {isExpanded && (
                <div style={s.expandedBody}>
                  {/* Answer */}
                  {fatwa.answer?.text && (
                    <div style={s.answerBox}>
                      <p style={s.answerLabel}>📜 Answer</p>
                      <div
                        style={{
                          ...s.answerText,
                          direction:  isRTL ? 'rtl' : 'ltr',
                          textAlign:  isRTL ? 'right' : 'left',
                          fontFamily: isRTL
                            ? "'Noto Nastaliq Urdu', serif"
                            : 'inherit',
                          fontSize:   isRTL ? '16px' : '14px',
                          lineHeight: isRTL ? '2.2' : '1.7',
                        }}
                      >
                        {fatwa.answer.text}
                      </div>
                      {fatwa.answer.answeredBy && (
                        <p style={s.muftiCredit}>
                          — Answered by{' '}
                          <strong>{fatwa.answer.answeredBy.name}</strong>
                          {fatwa.answer.answeredBy.specialization &&
                            ` · ${fatwa.answer.answeredBy.specialization}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Approval Stamp */}
                  {fatwa.approval?.isApproved && (
                    <ApprovalStamp
                      stampCode={fatwa.approval.stampCode}
                      fatwaNumber={fatwa.fatwaNumber}
                      fatwaDate={fatwa.fatwaDate}
                      approvedBy={fatwa.approval.approvedBy?.name}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Pagination ───────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div style={s.pagination}>
          <button
            style={{ ...s.pgBtn, opacity: !pagination.hasPrev ? 0.4 : 1 }}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            disabled={!pagination.hasPrev}
          >
            ← Prev
          </button>
          <span style={s.pgInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            style={{ ...s.pgBtn, opacity: !pagination.hasNext ? 0.4 : 1 }}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            disabled={!pagination.hasNext}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

const s = {
  page:        { maxWidth: '860px', margin: '0 auto', padding: '40px 20px', minHeight: '100vh' },
  pageHeader:  { textAlign: 'center', marginBottom: '36px' },
  pageTitle:   { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' },
  pageSubtitle:{ color: '#64748b', fontSize: '16px', margin: 0 },
  filterBar:   { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: '200px', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  filterSelect:{ padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', color: '#374151' },
  clearBtn:    { padding: '10px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b', fontWeight: '600' },
  statsBar:    { fontSize: '13px', color: '#64748b', marginBottom: '20px' },
  center:      { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '60px', color: '#64748b' },
  spinner:     { width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorBox:    { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '20px' },
  emptyState:  { textAlign: 'center', padding: '80px 20px', color: '#64748b' },
  feedList:    { display: 'flex', flexDirection: 'column', gap: '20px' },
  card:        { background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' },
  cardMeta:    { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  langBadge:   { padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  catBadge:    { padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
  viewCount:   { fontSize: '12px', color: '#94a3b8' },
  fatwaMeta:   { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
  fatwaNumber: { fontSize: '12px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '3px 10px', borderRadius: '6px', border: '1px solid #a7f3d0' },
  fatwaDate:   { fontSize: '12px', color: '#64748b' },
  questionText:{ fontSize: '16px', color: '#1e293b', marginBottom: '16px', lineHeight: '1.6' },
  expandBtn:   { background: 'none', border: '1px solid #e2e8f0', color: '#3b82f6', padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  expandedBody:{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' },
  answerBox:   { background: '#f8fafc', borderRadius: '10px', padding: '18px', marginBottom: '16px', border: '1px solid #e2e8f0' },
  answerLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' },
  answerText:  { fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.7' },
  muftiCredit: { margin: '12px 0 0', fontSize: '13px', color: '#64748b', fontStyle: 'italic' },
  pagination:  { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px' },
  pgBtn:       { background: '#10b981', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  pgInfo:      { color: '#64748b', fontSize: '14px' },
};

export default PublicFeed;
