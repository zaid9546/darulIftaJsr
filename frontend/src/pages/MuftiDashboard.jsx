import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMuftiAssigned,
  submitAnswer,
  clearSuccessMessage,
  clearQuestionError,
  selectMuftiQuestions,
  selectMuftiPagination,
  selectQLoading,
  selectActionLoading,
  selectQError,
  selectActionError,
  selectSuccessMessage,
} from '../features/questions/questionSlice';
import { selectUser } from '../features/auth/authSlice';

const STATUS_STYLES = {
  assigned: { bg: '#eff6ff', color: '#1d4ed8', label: '📋 Assigned' },
  revision: { bg: '#fffbeb', color: '#b45309', label: '🔄 Revision' },
  answered: { bg: '#f0fdf4', color: '#15803d', label: '✅ Answered' },
};

const MuftiDashboard = () => {
  const dispatch      = useDispatch();
  const user          = useSelector(selectUser);
  const questions     = useSelector(selectMuftiQuestions);
  const pagination    = useSelector(selectMuftiPagination);
  const loading       = useSelector(selectQLoading);
  const actionLoading = useSelector(selectActionLoading);
  const error         = useSelector(selectQError);
  const actionError   = useSelector(selectActionError);
  const successMsg    = useSelector(selectSuccessMessage);

  const [selectedId, setSelectedId]   = useState(null);
  const [answerText, setAnswerText]   = useState('');
  const [references, setReferences]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]               = useState(1);

  // ── Load assigned questions ────────────────────────
  useEffect(() => {
    const params = { page, limit: 10 };
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchMuftiAssigned(params));
  }, [dispatch, page, statusFilter]);

  // ── Clear messages on unmount ──────────────────────
  useEffect(() => {
    return () => {
      dispatch(clearSuccessMessage());
      dispatch(clearQuestionError());
    };
  }, [dispatch]);

  // ── Auto-clear success after 4s ───────────────────
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => dispatch(clearSuccessMessage()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, dispatch]);

  const handleSelectQuestion = (q) => {
    setSelectedId(q._id === selectedId ? null : q._id);
    setAnswerText(q.answer?.text || '');
    setReferences(q.answer?.references?.join(', ') || '');
  };

  const handleSubmitAnswer = (e) => {
    e.preventDefault();
    if (!answerText.trim() || answerText.trim().length < 10) return;
    dispatch(submitAnswer({
      questionId:  selectedId,
      answerText:  answerText.trim(),
      references:  references.split(',').map((r) => r.trim()).filter(Boolean),
    })).then((res) => {
      if (!res.error) {
        setSelectedId(null);
        setAnswerText('');
        setReferences('');
      }
    });
  };

  const selectedQ = questions.find((q) => q._id === selectedId);

  return (
    <div style={s.page}>

      {/* ── Header ──────────────────────────────────── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>📋 Mufti Dashboard</h1>
          <p style={s.subtitle}>Welcome, <strong>{user?.name}</strong> · {user?.specialization || 'Scholar'}</p>
        </div>
        {pagination && (
          <div style={s.statBadge}>
            📥 {pagination.total} Assigned
          </div>
        )}
      </div>

      {/* ── Success Toast ────────────────────────────── */}
      {successMsg && (
        <div style={s.successToast}>✅ {successMsg}</div>
      )}

      {/* ── Error Banner ────────────────────────────── */}
      {(error || actionError) && (
        <div style={s.errorBanner}>⚠️ {error || actionError}</div>
      )}

      <div style={s.layout}>

        {/* ══ LEFT: Question List ════════════════════ */}
        <div style={s.listPanel}>

          {/* Filter Tabs */}
          <div style={s.filterTabs}>
            {[
              { value: '',         label: '📋 All' },
              { value: 'assigned', label: '🔵 Assigned' },
              { value: 'revision', label: '🟡 Revision' },
              { value: 'answered', label: '🟢 Answered' },
            ].map((tab) => (
              <button
                key={tab.value}
                style={{
                  ...s.tab,
                  ...(statusFilter === tab.value ? s.tabActive : {}),
                }}
                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div style={s.center}>
              <div style={s.spinner} /> Loading...
            </div>
          ) : questions.length === 0 ? (
            <div style={s.emptyState}>
              <div style={{ fontSize: '48px' }}>📭</div>
              <p>No questions assigned yet.</p>
            </div>
          ) : (
            questions.map((q) => {
              const st = STATUS_STYLES[q.status] || STATUS_STYLES.assigned;
              const isRTL = ['urdu', 'hindi'].includes(q.language);
              const isSelected = selectedId === q._id;

              return (
                <div
                  key={q._id}
                  style={{
                    ...s.qCard,
                    ...(isSelected ? s.qCardSelected : {}),
                  }}
                  onClick={() => handleSelectQuestion(q)}
                >
                  {/* Status Badge */}
                  <div style={s.qCardTop}>
                    <span style={{ ...s.statusBadge, background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                    <span style={s.qDate}>
                      {new Date(q.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>

                  {/* Question Text Preview */}
                  <p style={{
                    ...s.qPreview,
                    direction:  isRTL ? 'rtl' : 'ltr',
                    textAlign:  isRTL ? 'right' : 'left',
                    fontFamily: isRTL ? "'Noto Nastaliq Urdu', serif" : 'inherit',
                    fontSize:   isRTL ? '15px' : '14px',
                    lineHeight: isRTL ? '2' : '1.5',
                  }}>
                    {q.questionText.length > 120
                      ? q.questionText.slice(0, 120) + '...'
                      : q.questionText}
                  </p>

                  {/* Category Tag */}
                  <span style={s.catTag}>{q.category}</span>

                  {/* Revision Note */}
                  {q.status === 'revision' && q.answer?.revisionNote && (
                    <div style={s.revisionNote}>
                      🔄 <strong>Revision Note:</strong> {q.answer.revisionNote}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={s.pagination}>
              <button
                style={{ ...s.pgBtn, opacity: !pagination.hasPrev ? 0.4 : 1 }}
                onClick={() => setPage((p) => p - 1)}
                disabled={!pagination.hasPrev}
              >← Prev</button>
              <span style={s.pgInfo}>{page} / {pagination.totalPages}</span>
              <button
                style={{ ...s.pgBtn, opacity: !pagination.hasNext ? 0.4 : 1 }}
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
              >Next →</button>
            </div>
          )}
        </div>

        {/* ══ RIGHT: Answer Panel ════════════════════ */}
        <div style={s.answerPanel}>
          {!selectedQ ? (
            <div style={s.noSelection}>
              <div style={{ fontSize: '56px' }}>👈</div>
              <p>Select a question from the left to write your answer.</p>
            </div>
          ) : (
            <>
              <h3 style={s.answerPanelTitle}>✍️ Write Answer</h3>

              {/* Full Question */}
              <div style={s.fullQuestion}>
                <p style={s.fullQLabel}>❓ Question</p>
                <p style={{
                  ...s.fullQText,
                  direction:  ['urdu','hindi'].includes(selectedQ.language) ? 'rtl' : 'ltr',
                  textAlign:  ['urdu','hindi'].includes(selectedQ.language) ? 'right' : 'left',
                  fontFamily: ['urdu','hindi'].includes(selectedQ.language) ? "'Noto Nastaliq Urdu', serif" : 'inherit',
                  fontSize:   ['urdu','hindi'].includes(selectedQ.language) ? '17px' : '15px',
                  lineHeight: ['urdu','hindi'].includes(selectedQ.language) ? '2.2' : '1.6',
                }}>
                  {selectedQ.questionText}
                </p>
              </div>

              {/* Answer Form */}
              <form onSubmit={handleSubmitAnswer} style={s.answerForm}>
                <div style={s.field}>
                  <label style={s.label}>📝 Your Answer</label>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Write a detailed Islamic ruling with supporting evidence..."
                    style={{
                      ...s.answerTextarea,
                      direction:  ['urdu','hindi'].includes(selectedQ.language) ? 'rtl' : 'ltr',
                      textAlign:  ['urdu','hindi'].includes(selectedQ.language) ? 'right' : 'left',
                      fontFamily: ['urdu','hindi'].includes(selectedQ.language) ? "'Noto Nastaliq Urdu', serif" : 'inherit',
                      fontSize:   ['urdu','hindi'].includes(selectedQ.language) ? '16px' : '14px',
                      lineHeight: ['urdu','hindi'].includes(selectedQ.language) ? '2.2' : '1.7',
                    }}
                    required
                    minLength={10}
                    maxLength={10000}
                  />
                  <span style={s.charCount}>{answerText.length} / 10000</span>
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    📚 References (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={references}
                    onChange={(e) => setReferences(e.target.value)}
                    placeholder="e.g. Quran 2:185, Sahih Bukhari 1798, Fatawa Alamgiri Vol.1"
                    style={s.refInput}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    ...s.submitBtn,
                    opacity: (actionLoading || answerText.trim().length < 10) ? 0.6 : 1,
                  }}
                  disabled={actionLoading || answerText.trim().length < 10}
                >
                  {actionLoading
                    ? '⏳ Submitting...'
                    : selectedQ.status === 'revision'
                    ? '🔄 Resubmit Answer'
                    : '✅ Submit Answer'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const s = {
  page:           { maxWidth: '1200px', margin: '0 auto', padding: '32px 20px', minHeight: '100vh' },
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  title:          { fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' },
  subtitle:       { color: '#64748b', fontSize: '14px', margin: 0 },
  statBadge:      { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '8px 18px', borderRadius: '999px', fontSize: '14px', fontWeight: '700' },
  successToast:   { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' },
  errorBanner:    { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' },
  layout:         { display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px', alignItems: 'start' },
  listPanel:      { background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' },
  filterTabs:     { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' },
  tab:            { padding: '6px 14px', borderRadius: '999px', border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#64748b' },
  tabActive:      { background: '#10b981', borderColor: '#10b981', color: '#fff' },
  center:         { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '40px', color: '#64748b' },
  spinner:        { width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyState:     { textAlign: 'center', padding: '48px 20px', color: '#94a3b8' },
  qCard:          { border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px', cursor: 'pointer', transition: 'all 0.2s', background: '#fafafa' },
  qCardSelected:  { borderColor: '#10b981', background: '#f0fdf4', boxShadow: '0 0 0 3px #10b98120' },
  qCardTop:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  statusBadge:    { padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' },
  qDate:          { fontSize: '11px', color: '#94a3b8' },
  qPreview:       { fontSize: '14px', color: '#374151', margin: '0 0 8px' },
  catTag:         { fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' },
  revisionNote:   { marginTop: '8px', fontSize: '12px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 10px' },
  pagination:     { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '16px' },
  pgBtn:          { background: '#10b981', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  pgInfo:         { fontSize: '13px', color: '#64748b' },
  answerPanel:    { background: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9', minHeight: '400px' },
  noSelection:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '360px', color: '#94a3b8', textAlign: 'center', gap: '12px' },
  answerPanelTitle:{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px' },
  fullQuestion:   { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' },
  fullQLabel:     { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' },
  fullQText:      { fontSize: '15px', color: '#1e293b', margin: 0, lineHeight: '1.6' },
  answerForm:     { display: 'flex', flexDirection: 'column', gap: '18px' },
  field:          { display: 'flex', flexDirection: 'column', gap: '6px' },
  label:          { fontSize: '13px', fontWeight: '600', color: '#374151' },
  answerTextarea: { padding: '14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', minHeight: '220px', resize: 'vertical', outline: 'none', color: '#0f172a' },
  charCount:      { fontSize: '11px', color: '#94a3b8', textAlign: 'right' },
  refInput:       { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', color: '#374151' },
  submitBtn:      { background: '#10b981', color: '#fff', border: 'none', padding: '13px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
};

export default MuftiDashboard;
