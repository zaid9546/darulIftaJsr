import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllQuestionsAdmin,
  assignQuestion,
  approveQuestion,
  rejectQuestion,
  requestRevision,
  clearSuccessMessage,
  clearQuestionError,
  clearApprovalResult,
  selectAdminQuestions,
  selectAdminPagination,
  selectStatusCounts,
  selectQLoading,
  selectActionLoading,
  selectQError,
  selectActionError,
  selectSuccessMessage,
  selectApprovalResult,
} from '../features/questions/questionSlice';
import ApprovalStamp   from '../components/ApprovalStamp';
import AssignModal     from '../components/modals/AssignModal';
import ApproveModal    from '../components/modals/ApproveModal';
import RejectModal     from '../components/modals/RejectModal';
import RevisionModal   from '../components/modals/RevisionModal';
import DetailModal from '../components/DetailModal';
import axiosInstance from '../utils/axiosInstance';
import BulkExportButton from "../components/BulkExportButton";
import ModalWrapper from "../components/modals/ModalWrapper";


// ── Status config ──────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: '⏳ Pending',   bg: '#fefce8', color: '#854d0e', border: '#fef08a' },
  assigned:  { label: '📋 Assigned',  bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  answered:  { label: '✍️ Answered',  bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  revision:  { label: '🔄 Revision',  bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  published: { label: '🌍 Published', bg: '#f0fdf4', color: '#065f46', border: '#6ee7b7' },
  rejected:  { label: '❌ Rejected',  bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
};

// ════════════════════════════════════════════════════
const SuperAdminDashboard = () => {
  const dispatch       = useDispatch();
  const questions      = useSelector(selectAdminQuestions);
  const pagination     = useSelector(selectAdminPagination);
  const statusCounts   = useSelector(selectStatusCounts);
  const loading        = useSelector(selectQLoading);
  const actionLoading  = useSelector(selectActionLoading);
  const error          = useSelector(selectQError);
  const actionError    = useSelector(selectActionError);
  const successMsg     = useSelector(selectSuccessMessage);
  const approvalResult = useSelector(selectApprovalResult);

  // ── Filters & Pagination ───────────────────────────
  const [filters, setFilters] = useState({
    status: '', language: '', category: '', page: 1, limit: 15,
  });

  // ── Selected Question (for modals) ─────────────────
  const [selectedQ, setSelectedQ] = useState(null);

  // ── Modal Visibility ───────────────────────────────
  const [modal, setModal] = useState(null);
  // modal: 'assign' | 'approve' | 'reject' | 'revision' | 'stamp' | 'detail'

  // ── Load Questions ─────────────────────────────────
  useEffect(() => {
    const params = { page: filters.page, limit: filters.limit };
    if (filters.status)   params.status   = filters.status;
    if (filters.language) params.language = filters.language;
    if (filters.category) params.category = filters.category;
    dispatch(fetchAllQuestionsAdmin(params));
  }, [dispatch, filters]);

  // ── Auto-clear success toast ───────────────────────
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => dispatch(clearSuccessMessage()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, dispatch]);

  // ── Cleanup on unmount ─────────────────────────────
  useEffect(() => {
    return () => {
      dispatch(clearSuccessMessage());
      dispatch(clearQuestionError());
    };
  }, [dispatch]);

  // ── Open modal helper ──────────────────────────────
  const openModal = (type, question) => {
    setSelectedQ(question);
    setModal(type);
  };
  const closeModal = () => {
    setModal(null);
    setSelectedQ(null);
    dispatch(clearApprovalResult());
  };

  // ── Filter change ──────────────────────────────────
  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // ── Format date ────────────────────────────────────
  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  // ── Total questions count ──────────────────────────
  const totalAll = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={s.page}>
      {/* ── Admin Tab Bar ─────────────────────────────── */}
<div style={{
  display:      "flex",
  gap:          "8px",
  marginBottom: "28px",
  borderBottom: "2px solid #e2e8f0",
  paddingBottom:"0",
  flexWrap:     "wrap",
}}>
  {[
    { path: "/admin",        icon: "🛠️",  label: "Dashboard",        active: true  },
    { path: "/admin/muftis", icon: "🧕",  label: "Mufti Management", active: false },
    { path: "/fatwas",       icon: "📖",  label: "Public Fatwas",    active: false },
  ].map((tab) => (
    <Link
      key={tab.path}
      to={tab.path}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            "8px",
        padding:        "12px 20px",
        borderRadius:   "8px 8px 0 0",
        textDecoration: "none",
        fontSize:       "14px",
        fontWeight:     "700",
        borderBottom:   tab.active ? "3px solid #065f46" : "3px solid transparent",
        color:          tab.active ? "#065f46" : "#64748b",
        background:     tab.active ? "#f0fdf4" : "transparent",
        transition:     "all 0.15s",
        marginBottom:   "-2px",
      }}
    >
      {tab.icon} {tab.label}
    </Link>
  ))}
</div>

      {/* ══ PAGE HEADER ════════════════════════════════ */}
<div style={s.pageHeader}>
  <div>
    <h1 style={s.pageTitle}>🛠️ Super Admin Dashboard</h1>
    <p style={s.pageSubtitle}>Manage all questions, assignments, approvals & publications</p>
  </div>

  {/* ── Right side: Total Badge + Bulk Export ──── */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
    <div style={s.totalBadge}>
      📊 {totalAll} Total Questions
    </div>

    {/* ✅ BULK EXPORT BUTTON — PASTE HERE */}
    <BulkExportButton filters={filters} />
  </div>

</div>


      {/* ══ TOAST & ERROR BANNERS ═══════════════════════ */}
      {successMsg && (
        <div style={s.successToast}>✅ {successMsg}</div>
      )}
      {(error || actionError) && (
        <div style={s.errorBanner}>⚠️ {error || actionError}</div>
      )}

      {/* ══ STATUS WIDGETS ══════════════════════════════ */}
      <div style={s.widgetGrid}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            style={{
              ...s.widget,
              background:  cfg.bg,
              border:      `1.5px solid ${cfg.border}`,
              outline:     filters.status === key ? `3px solid ${cfg.color}` : 'none',
              outlineOffset: '2px',
            }}
            onClick={() =>
              handleFilter('status', filters.status === key ? '' : key)
            }
          >
            <span style={{ ...s.widgetCount, color: cfg.color }}>
              {statusCounts[key] || 0}
            </span>
            <span style={{ ...s.widgetLabel, color: cfg.color }}>
              {cfg.label}
            </span>
          </button>
        ))}
      </div>

      {/* ══ QUICK ACCESS CARDS ════════════════════════════ */}
<div style={{
  display:       "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap:           "16px",
  marginBottom:  "28px",
}}>

  {/* ── Mufti Management Card ─────────────────────── */}
  <Link
    to="/admin/muftis"
    style={{
      display:        "flex",
      alignItems:     "center",
      gap:            "16px",
      background:     "#fff",
      border:         "2px solid #bbf7d0",
      borderRadius:   "14px",
      padding:        "20px 24px",
      textDecoration: "none",
      boxShadow:      "0 2px 12px rgba(6,95,70,0.08)",
      transition:     "transform 0.15s, box-shadow 0.15s",
    }}
  >
    <div style={{
      width:          "52px",
      height:         "52px",
      borderRadius:   "14px",
      background:     "#ecfdf5",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      fontSize:       "26px",
      flexShrink:     0,
    }}>
      🧕
    </div>
    <div>
      <p style={{ fontSize:"15px", fontWeight:"800", color:"#065f46", margin:"0 0 3px" }}>
        Mufti Management
      </p>
      <p style={{ fontSize:"12px", color:"#64748b", margin:0 }}>
        Add · View · Activate · Deactivate
      </p>
    </div>
    <span style={{ marginLeft:"auto", color:"#10b981", fontSize:"20px" }}>→</span>
  </Link>

  {/* ── Add New Mufti Card ────────────────────────── */}
  <Link
    to="/admin/muftis/register"
    style={{
      display:        "flex",
      alignItems:     "center",
      gap:            "16px",
      background:     "#fff",
      border:         "2px solid #e9d5ff",
      borderRadius:   "14px",
      padding:        "20px 24px",
      textDecoration: "none",
      boxShadow:      "0 2px 12px rgba(0,0,0,0.05)",
      transition:     "transform 0.15s, box-shadow 0.15s",
    }}
  >
    <div style={{
      width:          "52px",
      height:         "52px",
      borderRadius:   "14px",
      background:     "#faf5ff",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      fontSize:       "26px",
      flexShrink:     0,
    }}>
      ➕
    </div>
    <div>
      <p style={{ fontSize:"15px", fontWeight:"800", color:"#7c3aed", margin:"0 0 3px" }}>
        Register New Mufti
      </p>
      <p style={{ fontSize:"12px", color:"#64748b", margin:0 }}>
        Create a new Mufti account
      </p>
    </div>
    <span style={{ marginLeft:"auto", color:"#7c3aed", fontSize:"20px" }}>→</span>
  </Link>

  {/* ── Bulk PDF Export Card ──────────────────────── */}
  <div
    style={{
      display:    "flex",
      alignItems: "center",
      gap:        "16px",
      background: "#fff",
      border:     "2px solid #fde68a",
      borderRadius:"14px",
      padding:    "20px 24px",
      boxShadow:  "0 2px 12px rgba(0,0,0,0.05)",
    }}
  >
    <div style={{
      width:          "52px",
      height:         "52px",
      borderRadius:   "14px",
      background:     "#fffbeb",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      fontSize:       "26px",
      flexShrink:     0,
    }}>
      📦
    </div>
    <div style={{ flex:1 }}>
      <p style={{ fontSize:"15px", fontWeight:"800", color:"#92400e", margin:"0 0 3px" }}>
        Bulk Export PDFs
      </p>
      <p style={{ fontSize:"12px", color:"#64748b", margin:0 }}>
        Download filtered Fatwas as ZIP
      </p>
    </div>
    <BulkExportButton filters={filters} />
  </div>

</div>


      {/* ══ FILTER BAR ══════════════════════════════════ */}
      <div style={s.filterBar}>
        <select
          value={filters.status}
          onChange={(e) => handleFilter('status', e.target.value)}
          style={s.filterSelect}
        >
          <option value="">📊 All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={filters.language}
          onChange={(e) => handleFilter('language', e.target.value)}
          style={s.filterSelect}
        >
          <option value="">🌍 All Languages</option>
          <option value="english">🇬🇧 English</option>
          <option value="urdu">🇵🇰 Urdu</option>
          <option value="hindi">🇮🇳 Hindi</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => handleFilter('category', e.target.value)}
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

        {(filters.status || filters.language || filters.category) && (
          <button
            style={s.clearBtn}
            onClick={() =>
              setFilters({ status: '', language: '', category: '', page: 1, limit: 15 })
            }
          >
            ✕ Clear Filters
          </button>
        )}

        {pagination && (
          <span style={s.resultCount}>
            {pagination.total} result{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ══ QUESTIONS TABLE ═════════════════════════════ */}
      <div style={s.tableWrapper}>
        {loading ? (
          <div style={s.center}>
            <div style={s.spinner} /> Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ fontSize: '56px' }}>📭</div>
            <h3 style={{ color: '#64748b', margin: '12px 0 4px' }}>No Questions Found</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                <th style={s.th}>#</th>
                <th style={s.th}>Question</th>
                <th style={s.th}>Lang</th>
                <th style={s.th}>Category</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Assigned To</th>
                <th style={s.th}>Fatwa No.</th>
                <th style={s.th}>Submitted</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, idx) => {
                const cfg   = STATUS_CONFIG[q.status] || STATUS_CONFIG.pending;
                const isRTL = ['urdu', 'hindi'].includes(q.language);
                const rowNum = (filters.page - 1) * filters.limit + idx + 1;

                return (
                  <tr key={q._id} style={{ ...s.tbodyRow, background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>

                    {/* # */}
                    <td style={{ ...s.td, color: '#94a3b8', fontSize: '12px' }}>
                      {rowNum}
                    </td>

                    {/* Question Preview */}
                    <td style={s.td}>
                      <p style={{
                        ...s.qPreview,
                        direction:  isRTL ? 'rtl' : 'ltr',
                        textAlign:  isRTL ? 'right' : 'left',
                        fontFamily: isRTL ? "'Noto Nastaliq Urdu', serif" : 'inherit',
                        fontSize:   isRTL ? '14px' : '13px',
                        lineHeight: isRTL ? '2' : '1.5',
                      }}>
                        {q.questionText.length > 90
                          ? q.questionText.slice(0, 90) + '…'
                          : q.questionText}
                      </p>
                    </td>

                    {/* Language */}
                    <td style={s.td}>
                      <span style={s.langPill}>
                        {q.language === 'urdu' ? '🇵🇰'
                         : q.language === 'hindi' ? '🇮🇳' : '🇬🇧'}
                      </span>
                    </td>

                    {/* Category */}
                    <td style={{ ...s.td, fontSize: '12px', color: '#64748b' }}>
                      {q.category}
                    </td>

                    {/* Status Badge */}
                    <td style={s.td}>
                      <span style={{
                        ...s.statusBadge,
                        background: cfg.bg,
                        color:      cfg.color,
                        border:     `1px solid ${cfg.border}`,
                      }}>
                        {cfg.label}
                      </span>
                    </td>

                    {/* Assigned To */}
                    <td style={{ ...s.td, fontSize: '12px', color: '#475569' }}>
                      {q.assignedTo?.name || <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>

                    {/* Fatwa Number */}
                    <td style={s.td}>
                      {q.fatwaNumber ? (
                        <code style={s.fatwaCode}>{q.fatwaNumber}</code>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>
                      )}
                    </td>

                    {/* Submitted Date */}
                    <td style={{ ...s.td, fontSize: '12px', color: '#94a3b8' }}>
                      {fmtDate(q.createdAt)}
                    </td>

                    {/* Actions */}
                    <td style={{ ...s.td, minWidth: '200px' }}>
                      <div style={s.actionGroup}>

                        {/* Detail View */}
                        <button
                          style={s.btnDetail}
                          onClick={() => openModal('detail', q)}
                          title="View full details"
                        >
                          👁️
                        </button>

                        {/* Assign — pending or revision */}
                        {['pending', 'revision'].includes(q.status) && (
                          <button
                            style={s.btnAssign}
                            onClick={() => openModal('assign', q)}
                          >
                            📋 Assign
                          </button>
                        )}

                        {/* Approve — answered only */}
                        {q.status === 'answered' && (
                          <button
                            style={s.btnApprove}
                            onClick={() => openModal('approve', q)}
                          >
                            ✅ Approve
                          </button>
                        )}

                        {/* Revision — answered only */}
                        {q.status === 'answered' && (
                          <button
                            style={s.btnRevision}
                            onClick={() => openModal('revision', q)}
                          >
                            🔄 Revise
                          </button>
                        )}

                        {/* Reject — any except published/rejected */}
                        {!['published', 'rejected'].includes(q.status) && (
                          <button
                            style={s.btnReject}
                            onClick={() => openModal('reject', q)}
                          >
                            ❌ Reject
                          </button>
                        )}

                        {/* View Stamp — published */}
                        {q.status === 'published' && (
                          <button
                            style={s.btnStamp}
                            onClick={() => openModal('stamp', q)}
                          >
                            🔐 Stamp
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ PAGINATION ══════════════════════════════════ */}
      {pagination && pagination.totalPages > 1 && (
        <div style={s.pagination}>
          <button
            style={{ ...s.pgBtn, opacity: !pagination.hasPrev ? 0.4 : 1 }}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            disabled={!pagination.hasPrev || loading}
          >
            ← Previous
          </button>
          <div style={s.pgPages}>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(
                pagination.page - 2 + i,
                pagination.totalPages
              ));
              return (
                <button
                  key={pg}
                  style={{
                    ...s.pgNum,
                    ...(pg === pagination.page ? s.pgNumActive : {}),
                  }}
                  onClick={() => setFilters((p) => ({ ...p, page: pg }))}
                >
                  {pg}
                </button>
              );
            })}
          </div>
          <button
            style={{ ...s.pgBtn, opacity: !pagination.hasNext ? 0.4 : 1 }}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            disabled={!pagination.hasNext || loading}
          >
            Next →
          </button>
        </div>
      )}

      {/* ══ MODALS ══════════════════════════════════════ */}

      {/* ── Assign Modal ──────────────────────────────── */}
      {modal === 'assign' && selectedQ && (
        <AssignModal
          question={selectedQ}
          actionLoading={actionLoading}
          onClose={closeModal}
          onAssign={({ muftiIds }) => {
  dispatch(
    assignQuestion({
      questionId: selectedQ._id,
      muftiIds,
    })
  ).then((res) => {
    if (!res.error) closeModal();
  });
}}
        />
      )}

      {/* ── Approve Modal ─────────────────────────────── */}
      {modal === 'approve' && selectedQ && (
        <ApproveModal
          question={selectedQ}
          actionLoading={actionLoading}
          approvalResult={approvalResult}
          onClose={closeModal}
          onApprove={({ notes }) => {
            dispatch(approveQuestion({ questionId: selectedQ._id, notes }));
            // Don't close — show stamp result inside modal
          }}
        />
      )}

      {/* ── Reject Modal ──────────────────────────────── */}
      {modal === 'reject' && selectedQ && (
        <RejectModal
          question={selectedQ}
          actionLoading={actionLoading}
          onClose={closeModal}
          onReject={({ rejectionReason }) => {
            dispatch(rejectQuestion({ questionId: selectedQ._id, rejectionReason }))
              .then((res) => { if (!res.error) closeModal(); });
          }}
        />
      )}

      {/* ── Revision Modal ────────────────────────────── */}
      {modal === 'revision' && selectedQ && (
        <RevisionModal
          question={selectedQ}
          actionLoading={actionLoading}
          onClose={closeModal}
          onRevision={({ revisionNote }) => {
            dispatch(requestRevision({ questionId: selectedQ._id, revisionNote }))
              .then((res) => { if (!res.error) closeModal(); });
          }}
        />
      )}

      {/* ── Stamp Modal ───────────────────────────────── */}
      {modal === 'stamp' && selectedQ && (
        <ModalWrapper onClose={closeModal} title="🔐 Official Fatwa Stamp">
          <ApprovalStamp
            stampCode={selectedQ.approval?.stampCode}
            fatwaNumber={selectedQ.fatwaNumber}
            fatwaDate={selectedQ.fatwaDate}
            approvedBy={selectedQ.approval?.approvedBy?.name}
          />
          <button style={{ ...s.btnClose, marginTop: '20px' }} onClick={closeModal}>
            Close
          </button>
        </ModalWrapper>
      )}

      {/* ── Detail Modal ──────────────────────────────── */}
      {modal === 'detail' && selectedQ && (
        <DetailModal question={selectedQ} onClose={closeModal} />
      )}
    </div>
  );
 
};





// ── Append these styles to SuperAdminDashboard.jsx ───
const s = {
  page:         { maxWidth: '1400px', margin: '0 auto', padding: '32px 20px', minHeight: '100vh' },
  pageHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  pageTitle:    { fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' },
  pageSubtitle: { color: '#64748b', fontSize: '14px', margin: 0 },
  totalBadge:   { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', padding: '8px 18px', borderRadius: '999px', fontSize: '14px', fontWeight: '700' },
  successToast: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600' },
  errorBanner:  { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' },

  // Widgets
  widgetGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' },
  widget:       { padding: '16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' },
  widgetCount:  { fontSize: '32px', fontWeight: '800', lineHeight: 1 },
  widgetLabel:  { fontSize: '12px', fontWeight: '700' },

  // Filters
  filterBar:    { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' },
  filterSelect: { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', color: '#374151', background: '#fff' },
  clearBtn:     { padding: '9px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#b91c1c', fontWeight: '600' },
  resultCount:  { fontSize: '13px', color: '#64748b', marginLeft: 'auto' },

  // Table
  tableWrapper: { background: '#fff', borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '24px' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  theadRow:     { background: '#f8fafc', borderBottom: '2px solid #f1f5f9' },
  th:           { padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tbodyRow:     { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
  td:           { padding: '12px 14px', verticalAlign: 'middle' },
  qPreview:     { margin: 0, color: '#374151', maxWidth: '280px' },
  langPill:     { fontSize: '18px' },
  statusBadge:  { padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' },
  fatwaCode:    { fontSize: '11px', fontFamily: 'monospace', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' },

  // Action Buttons
  actionGroup:  { display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' },
  btnDetail:    { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  btnAssign:    { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' },
  btnApprove:   { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' },
  btnRevision:  { background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' },
  btnReject:    { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' },
  btnStamp:     { background: '#f0fdf4', border: '1px solid #6ee7b7', color: '#065f46', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' },
  btnClose:     { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#374151', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },

  // Pagination
  pagination:   { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px' },
  pgBtn:        { background: '#10b981', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
  pgPages:      { display: 'flex', gap: '4px' },
  pgNum:        { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pgNumActive:  { background: '#10b981', borderColor: '#10b981', color: '#fff' },

  // Center / loader
  center:       { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '60px', color: '#64748b' },
  spinner:      { width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyState:   { textAlign: 'center', padding: '80px 20px' },
};



export default SuperAdminDashboard;