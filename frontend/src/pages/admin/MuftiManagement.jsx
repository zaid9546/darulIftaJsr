import { useState, useEffect, useCallback } from "react";
import { Link }                             from "react-router-dom";
import axiosInstance                        from "../../utils/axiosInstance";

const LANGUAGE_OPTIONS = ['urdu', 'hindi', 'english'];

// ── Default blank edit form ────────────────────────
const BLANK_FORM = {
  name:           '',
  email:          '',
  phone:          '',
  specialization: '',
  languages:      [],
  newPassword:    '',
};

const MuftiManagement = () => {
  const [muftis,    setMuftis]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [toast,     setToast]     = useState({ msg: '', type: 'success' });
  const [search,    setSearch]    = useState('');
  const [toggleId,  setToggleId]  = useState(null);

  // ── Edit modal state ──────────────────────────────
  const [editModal,    setEditModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);   // mufti being edited
  const [editForm,     setEditForm]     = useState(BLANK_FORM);
  const [editLoading,  setEditLoading]  = useState(false);
  const [editError,    setEditError]    = useState('');
  const [showResetPw,  setShowResetPw]  = useState(false);

  // ── Delete modal state ────────────────────────────
  const [deleteModal,   setDeleteModal]   = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Toast helper ──────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  // ── Fetch all Muftis ──────────────────────────────
  const fetchMuftis = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/users/muftis');
      setMuftis(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Muftis.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMuftis(); }, [fetchMuftis]);

  // ── Toggle Active/Inactive ────────────────────────
  const toggleActive = async (mufti) => {
    setToggleId(mufti._id);
    try {
      const res = await axiosInstance.patch(`/users/${mufti._id}/toggle-status`);
      setMuftis((prev) =>
        prev.map((m) =>
          m._id === mufti._id ? { ...m, isActive: res.data.data.isActive } : m
        )
      );
      showToast(`${mufti.name} is now ${res.data.data.isActive ? '✅ Active' : '⛔ Inactive'}`);
    } catch {
      showToast('⚠️ Failed to update status.', 'error');
    } finally {
      setToggleId(null);
    }
  };

  // ════════════════════════════════════════════════
  //  EDIT HANDLERS
  // ════════════════════════════════════════════════
  const openEdit = (mufti) => {
    setEditTarget(mufti);
    setEditForm({
      name:           mufti.name           || '',
      email:          mufti.email          || '',
      phone:          mufti.phone          || '',
      specialization: mufti.specialization || '',
      languages:      mufti.languages      || [],
      newPassword:    '',
    });
    setEditError('');
    setShowResetPw(false);
    setEditModal(true);
  };

  const closeEdit = () => {
    setEditModal(false);
    setEditTarget(null);
    setEditError('');
    setShowResetPw(false);
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLangToggle = (lang) => {
    setEditForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editForm.name.trim()) {
      return setEditError('Name is required.');
    }
    if (!editForm.email.trim()) {
      return setEditError('Email is required.');
    }
    if (showResetPw && editForm.newPassword && editForm.newPassword.length < 6) {
      return setEditError('Password must be at least 6 characters.');
    }

    const payload = {
      name:           editForm.name,
      email:          editForm.email,
      phone:          editForm.phone,
      specialization: editForm.specialization,
      languages:      editForm.languages,
    };
    if (showResetPw && editForm.newPassword) {
      payload.newPassword = editForm.newPassword;
    }

    setEditLoading(true);
    try {
      const res = await axiosInstance.patch(`/users/${editTarget._id}/edit`, payload);
      // Update local state immediately — no refetch needed
      setMuftis((prev) =>
        prev.map((m) => m._id === editTarget._id ? { ...m, ...res.data.data } : m)
      );
      showToast(`✅ ${res.data.data.name}'s profile updated successfully!`);
      closeEdit();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update. Try again.');
    } finally {
      setEditLoading(false);
    }
  };

  // ════════════════════════════════════════════════
  //  DELETE HANDLERS
  // ════════════════════════════════════════════════
  const openDelete = (mufti) => {
    setDeleteTarget(mufti);
    setDeleteModal(true);
  };

  const closeDelete = () => {
    setDeleteModal(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/users/${deleteTarget._id}`);
      setMuftis((prev) => prev.filter((m) => m._id !== deleteTarget._id));
      showToast(`🗑️ ${deleteTarget.name} has been deleted.`, 'error');
      closeDelete();
    } catch (err) {
      showToast(err.response?.data?.message || '⚠️ Failed to delete.', 'error');
      closeDelete();
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Filtered list ──────────────────────────────
  const filtered = muftis.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.specialization || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount   = muftis.filter((m) =>  m.isActive).length;
  const inactiveCount = muftis.filter((m) => !m.isActive).length;

  return (
    <div style={s.page}>

      {/* ── Toast Notification ───────────────────── */}
      {toast.msg && (
        <div style={{
          ...s.toast,
          background: toast.type === 'error' ? '#dc2626' : '#065f46',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ════════════════════════════════════════════
          EDIT MODAL
      ════════════════════════════════════════════ */}
      {editModal && editTarget && (
        <div style={s.modalOverlay} onClick={closeEdit}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>

            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>✏️ Edit Mufti Profile</h2>
              <button style={s.modalClose} onClick={closeEdit}>✕</button>
            </div>

            {editError && <div style={s.modalError}>{editError}</div>}

            <form onSubmit={submitEdit} style={s.modalForm}>

              {/* Name */}
              <div style={s.mField}>
                <label style={s.mLabel}>📛 Full Name *</label>
                <input
                  style={s.mInput}
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  placeholder="Mufti full name"
                  required
                />
              </div>

              {/* Email */}
              <div style={s.mField}>
                <label style={s.mLabel}>📧 Email Address *</label>
                <input
                  style={s.mInput}
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  placeholder="email@example.com"
                  required
                />
              </div>

              {/* Phone */}
              <div style={s.mField}>
                <label style={s.mLabel}>📱 Mobile Number</label>
                <input
                  style={s.mInput}
                  name="phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  placeholder="+91 9876543210"
                />
              </div>

              {/* Specialization */}
              <div style={s.mField}>
                <label style={s.mLabel}>🎓 Specialization</label>
                <input
                  style={s.mInput}
                  name="specialization"
                  value={editForm.specialization}
                  onChange={handleEditChange}
                  placeholder="e.g. Fiqh, Hadith, Islamic Finance"
                />
              </div>

              {/* Languages */}
              <div style={s.mField}>
                <label style={s.mLabel}>🌐 Languages</label>
                <div style={s.langRow}>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      style={{
                        ...s.langChip,
                        ...(editForm.languages.includes(lang) ? s.langChipActive : {}),
                      }}
                      onClick={() => handleLangToggle(lang)}
                    >
                      {lang === 'urdu' ? '🇵🇰' : lang === 'hindi' ? '🇮🇳' : '🇬🇧'}{' '}
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Password Toggle */}
              <button
                type="button"
                style={s.pwToggleBtn}
                onClick={() => setShowResetPw((p) => !p)}
              >
                {showResetPw ? '🔒 Cancel Password Reset' : '🔑 Reset Password'}
              </button>

              {showResetPw && (
                <div style={s.pwBox}>
                  <label style={s.mLabel}>New Password (min 6 chars)</label>
                  <input
                    style={s.mInput}
                    name="newPassword"
                    type="password"
                    value={editForm.newPassword}
                    onChange={handleEditChange}
                    placeholder="Leave blank to keep current password"
                    autoComplete="new-password"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div style={s.mBtnRow}>
                <button
                  type="button"
                  style={s.mCancelBtn}
                  onClick={closeEdit}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...s.mSaveBtn, opacity: editLoading ? 0.6 : 1 }}
                  disabled={editLoading}
                >
                  {editLoading ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ════════════════════════════════════════════ */}
      {deleteModal && deleteTarget && (
        <div style={s.modalOverlay} onClick={closeDelete}>
          <div style={{ ...s.modalBox, maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>

            <div style={s.deleteIconWrap}>
              <span style={{ fontSize: '48px' }}>🗑️</span>
            </div>

            <h2 style={s.deleteTitle}>Delete Mufti?</h2>
            <p style={s.deleteDesc}>
              You are about to permanently delete{' '}
              <strong>{deleteTarget.name}</strong>. This action{' '}
              <strong>cannot be undone</strong>.
            </p>

            <div style={s.mBtnRow}>
              <button
                style={s.mCancelBtn}
                onClick={closeDelete}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                style={{
                  ...s.mSaveBtn,
                  background: '#dc2626',
                  opacity: deleteLoading ? 0.6 : 1,
                }}
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? '⏳ Deleting...' : '🗑️ Yes, Delete'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Page Header ──────────────────────────── */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>🧕 Mufti Management</h1>
          <p style={s.pageSub}>Add, edit, and manage all registered Muftis</p>
        </div>
        <Link to="/admin/muftis/register" style={s.addBtn}>
          ➕ Add New Mufti
        </Link>
      </div>

      {/* ── Stats Row ────────────────────────────── */}
      <div style={s.statsRow}>
        {[
          { label: 'Total Muftis', num: muftis.length,  color: '#065f46', bg: '#ecfdf5', icon: '👥' },
          { label: 'Active',       num: activeCount,    color: '#059669', bg: '#f0fdf4', icon: '✅' },
          { label: 'Inactive',     num: inactiveCount,  color: '#dc2626', bg: '#fff5f5', icon: '⛔' },
        ].map((st) => (
          <div key={st.label} style={{ ...s.statCard, background: st.bg }}>
            <span style={{ fontSize: '28px' }}>{st.icon}</span>
            <span style={{ ...s.statNum, color: st.color }}>{st.num}</span>
            <span style={s.statLabel}>{st.label}</span>
          </div>
        ))}
      </div>

      {/* ── Search ───────────────────────────────── */}
      <div style={s.searchWrap}>
        <span style={s.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Search by name, email, or specialization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={s.searchInput}
        />
        {search && (
          <button style={s.searchClear} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* ── Error ────────────────────────────────── */}
      {error && (
        <div style={s.errorBox}>
          ⚠️ {error}
          <button style={s.errClose} onClick={fetchMuftis}>↺ Retry</button>
        </div>
      )}

      {/* ── Loading Skeleton ─────────────────────── */}
      {loading && (
        <div style={s.loadingWrap}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ ...s.skeletonRow, opacity: 1 - i * 0.3 }} />
          ))}
        </div>
      )}

      {/* ── Empty State ──────────────────────────── */}
      {!loading && !error && filtered.length === 0 && (
        <div style={s.emptyBox}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>
            {search ? '🔍' : '🧕'}
          </div>
          <h3 style={{ color: '#0f172a', margin: '0 0 8px' }}>
            {search ? 'No Muftis Found' : 'No Muftis Registered Yet'}
          </h3>
          <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: '14px' }}>
            {search
              ? 'Try a different name or email.'
              : "Click 'Add New Mufti' to register the first Mufti."}
          </p>
          {!search && (
            <Link to="/admin/muftis/register" style={s.addBtn}>
              ➕ Add First Mufti
            </Link>
          )}
        </div>
      )}

      {/* ── Mufti Table ──────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                <th style={s.th}>Mufti</th>
                <th style={s.th}>Specialization</th>
                <th style={s.th}>Languages</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Joined</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mufti) => (
                <tr key={mufti._id} style={s.tr}>

                  {/* Name + Email + Phone */}
                  <td style={s.td}>
                    <div style={s.muftiCell}>
                      <div style={{
                        ...s.avatar,
                        background: mufti.isActive ? '#065f46' : '#94a3b8',
                      }}>
                        {mufti.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={s.muftiName}>{mufti.name}</p>
                        <p style={s.muftiEmail}>{mufti.email}</p>
                        {mufti.phone && (
                          <p style={{ ...s.muftiEmail, color: '#10b981' }}>
                            📱 {mufti.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Specialization */}
                  <td style={s.td}>
                    <span style={s.specBadge}>
                      {mufti.specialization || '—'}
                    </span>
                  </td>

                  {/* Languages */}
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(mufti.languages || []).map((lang) => (
                        <span key={lang} style={s.langPill}>
                          {lang === 'urdu' ? '🇵🇰' : lang === 'hindi' ? '🇮🇳' : '🇬🇧'}{' '}
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </span>
                      ))}
                      {(!mufti.languages || mufti.languages.length === 0) && (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={s.td}>
                    <span style={{
                      ...s.statusBadge,
                      background: mufti.isActive ? '#ecfdf5' : '#fff1f2',
                      color:      mufti.isActive ? '#059669' : '#dc2626',
                      border:     `1px solid ${mufti.isActive ? '#a7f3d0' : '#fecdd3'}`,
                    }}>
                      {mufti.isActive ? '✅ Active' : '⛔ Inactive'}
                    </span>
                  </td>

                  {/* Joined */}
                  <td style={s.td}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(mufti.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </td>

                  {/* ✅ Actions: Toggle + Edit + Delete */}
                  <td style={s.td}>
                    <div style={s.actionRow}>

                      {/* Toggle Active */}
                      <button
                        style={{
                          ...s.toggleBtn,
                          background: mufti.isActive ? '#fff1f2' : '#ecfdf5',
                          color:      mufti.isActive ? '#dc2626' : '#059669',
                          border:     `1px solid ${mufti.isActive ? '#fecdd3' : '#a7f3d0'}`,
                          opacity:    toggleId === mufti._id ? 0.6 : 1,
                          cursor:     toggleId === mufti._id ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => toggleActive(mufti)}
                        disabled={toggleId === mufti._id}
                        title={mufti.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {toggleId === mufti._id
                          ? '⏳'
                          : mufti.isActive ? '⛔' : '✅'}
                      </button>

                      {/* ✅ Edit Button */}
                      <button
                        style={s.editBtn}
                        onClick={() => openEdit(mufti)}
                        title="Edit Mufti Profile"
                      >
                        ✏️
                      </button>

                      {/* ✅ Delete Button */}
                      <button
                        style={s.deleteBtn}
                        onClick={() => openDelete(mufti)}
                        title="Delete Mufti"
                      >
                        🗑️
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Guide Box ────────────────────────────── */}
      <div style={s.guideBox}>
        <h3 style={s.guideTitle}>📖 How to Manage Muftis</h3>
        <div style={s.guideSteps}>
          {[
            { n: '1', text: 'Click ➕ Add New Mufti to register a new Mufti with name, email, password, specialization, and languages.' },
            { n: '2', text: 'Click ✏️ Edit to update any Mufti\'s name, email, phone, specialization, or languages. You can also reset their password from here.' },
            { n: '3', text: 'Click ⛔/✅ to toggle a Mufti\'s active status. Inactive Muftis cannot log in.' },
            { n: '4', text: 'Click 🗑️ Delete to permanently remove a Mufti. A confirmation dialog will appear. This cannot be undone.' },
          ].map((step) => (
            <div key={step.n} style={s.guideStep}>
              <div style={s.guideNum}>{step.n}</div>
              <p style={s.guideText}>{step.text}</p>
            </div>
          ))}
        </div>
        <div style={s.guideNote}>
          🔐 <strong>Security Note:</strong> Only Super Admins can access this page.
          All edit and delete actions are protected by{' '}
          <code style={s.code}>restrictTo('super_admin')</code> middleware.
        </div>
      </div>

    </div>
  );
};

// ════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════
const s = {
  page:        { maxWidth: '1100px', margin: '0 auto', padding: '40px 20px', minHeight: '100vh' },
  toast:       { position: 'fixed', top: '20px', right: '20px', color: '#fff', padding: '12px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'background 0.3s' },
  pageHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' },
  pageTitle:   { fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' },
  pageSub:     { fontSize: '14px', color: '#64748b', margin: 0 },
  addBtn:      { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#065f46', color: '#fff', padding: '11px 22px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', textDecoration: 'none', boxShadow: '0 3px 10px rgba(6,95,70,0.3)' },
  statsRow:    { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  statCard:    { flex: 1, minWidth: '140px', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', border: '1px solid #f1f5f9' },
  statNum:     { fontSize: '28px', fontWeight: '900', lineHeight: 1 },
  statLabel:   { fontSize: '12px', fontWeight: '600', color: '#64748b' },
  searchWrap:  { position: 'relative', marginBottom: '20px' },
  searchIcon:  { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '13px 48px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' },
  searchClear: { position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '12px', color: '#64748b' },
  errorBox:    { display: 'flex', alignItems: 'center', gap: '12px', background: '#fff5f5', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px' },
  errClose:    { marginLeft: 'auto', background: '#fecaca', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', color: '#b91c1c' },
  loadingWrap: { display: 'flex', flexDirection: 'column', gap: '10px' },
  skeletonRow: { height: '64px', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', borderRadius: '10px' },
  emptyBox:    { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9' },
  tableWrap:   { background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '32px' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  theadRow:    { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th:          { padding: '14px 18px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  tr:          { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
  td:          { padding: '16px 18px', verticalAlign: 'middle' },
  muftiCell:   { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar:      { width: '40px', height: '40px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', flexShrink: 0 },
  muftiName:   { fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px' },
  muftiEmail:  { fontSize: '12px', color: '#64748b', margin: 0 },
  specBadge:   { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#374151', fontWeight: '600', display: 'inline-block', maxWidth: '200px' },
  langPill:    { background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', color: '#475569', fontWeight: '600' },
  statusBadge: { padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' },

  // ── Action buttons ──────────────────────────────
  actionRow:  { display: 'flex', gap: '6px', alignItems: 'center' },
  toggleBtn:  { padding: '6px 10px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', transition: 'opacity 0.15s', minWidth: '36px' },
  editBtn:    { padding: '6px 10px', borderRadius: '8px', fontSize: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', cursor: 'pointer', fontWeight: '700', transition: 'background 0.15s' },
  deleteBtn:  { padding: '6px 10px', borderRadius: '8px', fontSize: '14px', background: '#fff1f2', border: '1px solid #fecdd3', color: '#dc2626', cursor: 'pointer', fontWeight: '700', transition: 'background 0.15s' },

  // ── Modals ──────────────────────────────────────
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalBox:     { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 0', marginBottom: '16px' },
  modalTitle:   { fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 },
  modalClose:   { background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '16px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalError:   { margin: '0 28px 12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' },
  modalForm:    { padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: '14px' },
  mField:       { display: 'flex', flexDirection: 'column', gap: '6px' },
  mLabel:       { fontSize: '13px', fontWeight: '700', color: '#374151' },
  mInput:       { padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', color: '#111827', background: '#f9fafb', boxSizing: 'border-box', width: '100%' },
  langRow:      { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  langChip:     { padding: '7px 14px', borderRadius: '999px', border: '1px solid #d1d5db', background: '#f3f4f6', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  langChipActive: { background: '#065f46', border: '1px solid #065f46', color: '#fff' },
  pwToggleBtn:  { background: 'transparent', border: '1px dashed #10b981', color: '#065f46', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', textAlign: 'left' },
  pwBox:        { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' },
  mBtnRow:      { display: 'flex', gap: '10px', marginTop: '4px' },
  mCancelBtn:   { flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  mSaveBtn:     { flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: '#065f46', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },

  // ── Delete Modal ────────────────────────────────
  deleteIconWrap: { textAlign: 'center', paddingTop: '28px' },
  deleteTitle:    { textAlign: 'center', fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '8px 0 0' },
  deleteDesc:     { textAlign: 'center', fontSize: '14px', color: '#64748b', padding: '12px 28px 0', lineHeight: 1.6 },

  // ── Guide ───────────────────────────────────────
  guideBox:   { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', marginTop: '8px' },
  guideTitle: { fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 20px' },
  guideSteps: { display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' },
  guideStep:  { display: 'flex', alignItems: 'flex-start', gap: '14px' },
  guideNum:   { background: '#065f46', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 },
  guideText:  { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0, paddingTop: '3px' },
  guideNote:  { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 18px', fontSize: '13px', color: '#92400e', lineHeight: '1.7' },
  code:       { background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' },
};

export default MuftiManagement;
