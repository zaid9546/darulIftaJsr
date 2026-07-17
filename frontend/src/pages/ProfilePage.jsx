import { useState }                    from 'react';
import { useDispatch, useSelector }    from 'react-redux';
import {
  selectUser,
  selectAuthLoading,
  selectAuthError,
  updateUserProfile,
  clearAuthError,
} from '../features/auth/authSlice';

// ── Language options matching your User schema ────────
const LANGUAGE_OPTIONS = ['urdu', 'hindi', 'english'];

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);
  const loading  = useSelector(selectAuthLoading);
  const error    = useSelector(selectAuthError);

  const [editing,      setEditing]      = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [showPwSection, setShowPwSection] = useState(false);

  // ── Form state mirrors editable fields ────────────
  const [form, setForm] = useState({
    name:            user?.name            || '',
    email:           user?.email           || '',
    specialization:  user?.specialization  || '',
    languages:       user?.languages       || [],
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  // ── Handlers ──────────────────────────────────────
  const handleEdit = () => {
    // Reset form to current user data on edit open
    setForm({
      name:            user?.name            || '',
      email:           user?.email           || '',
      specialization:  user?.specialization  || '',
      languages:       user?.languages       || [],
      currentPassword: '',
      newPassword:     '',
      confirmPassword: '',
    });
    dispatch(clearAuthError());
    setSuccessMsg('');
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setShowPwSection(false);
    dispatch(clearAuthError());
    setSuccessMsg('');
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLanguageToggle = (lang) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    dispatch(clearAuthError());

    // ── Client-side password validation ───────────────
    if (showPwSection) {
      if (!form.currentPassword) {
        return dispatch({ type: 'auth/setError', payload: 'Enter your current password.' });
      }
      if (form.newPassword.length < 6) {
        return dispatch({ type: 'auth/setError', payload: 'New password must be at least 6 characters.' });
      }
      if (form.newPassword !== form.confirmPassword) {
        return dispatch({ type: 'auth/setError', payload: 'New passwords do not match.' });
      }
    }

    // ── Build payload ─────────────────────────────────
    const payload = {
      name:           form.name.trim(),
      specialization: form.specialization.trim(),
      languages:      form.languages,
    };

    // Only super_admin can send email
    if (user?.role === 'super_admin') {
      payload.email = form.email.trim();
    }

    // Only include password fields if changing password
    if (showPwSection && form.currentPassword && form.newPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword     = form.newPassword;
    }

    const result = await dispatch(updateUserProfile(payload));

    if (updateUserProfile.fulfilled.match(result)) {
      setSuccessMsg('✅ Profile updated successfully!');
      setEditing(false);
      setShowPwSection(false);
    }
  };

  // ── Role label helper ──────────────────────────────
  const roleLabel = {
    super_admin: '⚡ Super Admin',
    mufti:       '📚 Mufti',
  }[user?.role] || user?.role;

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* ── Header ─────────────────────────────────── */}
        <div style={s.cardHeader}>
          <div style={s.avatarWrap}>
            <div style={s.avatar}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
          <div>
            <h2 style={s.userName}>{user?.name}</h2>
            <span style={s.roleBadge}>{roleLabel}</span>
            {user?.profileId && (
              <p style={s.profileId}>ID: {user.profileId}</p>
            )}
          </div>
          {/* ✅ Edit icon — always visible, fully wired */}
          {!editing && (
            <button style={s.editIconBtn} onClick={handleEdit} title="Edit Profile">
              ✏️
            </button>
          )}
        </div>

        {/* ── Success / Error Messages ───────────────── */}
        {successMsg && <div style={s.successBanner}>{successMsg}</div>}
        {error      && <div style={s.errorBanner}>{error}</div>}

        {/* ══════════════════════════════════════════════
            VIEW MODE
        ══════════════════════════════════════════════ */}
        {!editing && (
          <div style={s.viewSection}>
            <InfoRow label="📛 Name"           value={user?.name}           />
            <InfoRow label="📧 Email"          value={user?.email}          />
            <InfoRow label="🎓 Specialization" value={user?.specialization || '—'} />
            <InfoRow
              label="🌐 Languages"
              value={
                user?.languages?.length
                  ? user.languages.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')
                  : '—'
              }
            />
            <InfoRow label="🔖 Role"    value={roleLabel}                  />
            <InfoRow label="✅ Status"  value={user?.isActive ? 'Active' : 'Inactive'} />
          </div>
        )}

        {/* ══════════════════════════════════════════════
            EDIT MODE
        ══════════════════════════════════════════════ */}
        {editing && (
          <form onSubmit={handleSubmit} style={s.form}>

            {/* Name */}
            <div style={s.fieldGroup}>
              <label style={s.label}>📛 Full Name *</label>
              <input
                style={s.input}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email — Super Admin only */}
            {user?.role === 'super_admin' && (
              <div style={s.fieldGroup}>
                <label style={s.label}>📧 Email *</label>
                <input
                  style={s.input}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                />
              </div>
            )}

            {/* Specialization — both roles */}
            <div style={s.fieldGroup}>
              <label style={s.label}>🎓 Specialization</label>
              <input
                style={s.input}
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                placeholder="e.g. Fiqh, Hadith, Islamic Finance"
              />
            </div>

            {/* Languages — both roles */}
            <div style={s.fieldGroup}>
              <label style={s.label}>🌐 Languages</label>
              <div style={s.langRow}>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    style={{
                      ...s.langChip,
                      ...(form.languages.includes(lang) ? s.langChipActive : {}),
                    }}
                    onClick={() => handleLanguageToggle(lang)}
                  >
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Change Password Toggle ──────────────── */}
            <button
              type="button"
              style={s.togglePwBtn}
              onClick={() => setShowPwSection((p) => !p)}
            >
              {showPwSection ? '🔒 Cancel Password Change' : '🔑 Change Password'}
            </button>

            {showPwSection && (
              <div style={s.pwSection}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Current Password</label>
                  <input
                    style={s.input}
                    name="currentPassword"
                    type="password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>New Password</label>
                  <input
                    style={s.input}
                    name="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Confirm New Password</label>
                  <input
                    style={s.input}
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {/* ── Action Buttons ──────────────────────── */}
            <div style={s.btnRow}>
              <button
                type="button"
                style={s.cancelBtn}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ ...s.saveBtn, opacity: loading ? 0.6 : 1 }}
                disabled={loading}
              >
                {loading ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

// ── Small helper component ─────────────────────────────
const InfoRow = ({ label, value }) => (
  <div style={s.infoRow}>
    <span style={s.infoLabel}>{label}</span>
    <span style={s.infoValue}>{value}</span>
  </div>
);

// ════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════
const s = {
  page: {
    minHeight:       '100vh',
    background:      '#f0fdf4',
    display:         'flex',
    justifyContent:  'center',
    alignItems:      'flex-start',
    padding:         '40px 16px',
  },
  card: {
    background:   '#fff',
    borderRadius: '16px',
    boxShadow:    '0 4px 24px rgba(0,0,0,0.10)',
    padding:      '32px',
    width:        '100%',
    maxWidth:     '560px',
  },

  // ── Header ────────────────────────────────────────
  cardHeader: {
    display:      'flex',
    alignItems:   'center',
    gap:          '16px',
    marginBottom: '24px',
    position:     'relative',
  },
  avatarWrap: { flexShrink: 0 },
  avatar: {
    width:          '64px',
    height:         '64px',
    borderRadius:   '50%',
    background:     '#065f46',
    color:          '#fff',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '28px',
    fontWeight:     '800',
  },
  userName: {
    margin:     0,
    fontSize:   '20px',
    fontWeight: '800',
    color:      '#064e3b',
  },
  roleBadge: {
    display:      'inline-block',
    background:   '#d1fae5',
    color:        '#065f46',
    fontSize:     '11px',
    fontWeight:   '700',
    padding:      '3px 10px',
    borderRadius: '999px',
    marginTop:    '4px',
  },
  profileId: {
    margin:   '4px 0 0',
    fontSize: '11px',
    color:    '#6b7280',
  },

  // ✅ Edit icon button — top-right of header
  editIconBtn: {
    position:   'absolute',
    top:        0,
    right:      0,
    background: 'transparent',
    border:     '1px solid #10b981',
    borderRadius: '8px',
    padding:    '6px 10px',
    cursor:     'pointer',
    fontSize:   '16px',
    color:      '#10b981',
    transition: 'background 0.15s',
  },

  // ── Banners ───────────────────────────────────────
  successBanner: {
    background:   '#d1fae5',
    border:       '1px solid #10b981',
    color:        '#065f46',
    padding:      '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize:     '14px',
    fontWeight:   '600',
  },
  errorBanner: {
    background:   '#fee2e2',
    border:       '1px solid #ef4444',
    color:        '#991b1b',
    padding:      '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize:     '14px',
    fontWeight:   '600',
  },

  // ── View Mode ─────────────────────────────────────
  viewSection: { display: 'flex', flexDirection: 'column', gap: '2px' },
  infoRow: {
    display:      'flex',
    padding:      '12px 0',
    borderBottom: '1px solid #f3f4f6',
    gap:          '12px',
  },
  infoLabel: {
    width:      '160px',
    flexShrink: 0,
    fontSize:   '13px',
    color:      '#6b7280',
    fontWeight: '600',
  },
  infoValue: {
    fontSize:   '14px',
    color:      '#111827',
    fontWeight: '500',
  },

  // ── Edit Form ─────────────────────────────────────
  form:       { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: {
    fontSize:   '13px',
    fontWeight: '700',
    color:      '#374151',
  },
  input: {
    padding:      '10px 14px',
    borderRadius: '8px',
    border:       '1px solid #d1d5db',
    fontSize:     '14px',
    outline:      'none',
    color:        '#111827',
    background:   '#f9fafb',
    width:        '100%',
    boxSizing:    'border-box',
  },

  // Languages
  langRow:       { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  langChip: {
    padding:      '7px 18px',
    borderRadius: '999px',
    border:       '1px solid #d1d5db',
    background:   '#f3f4f6',
    color:        '#374151',
    fontSize:     '13px',
    fontWeight:   '600',
    cursor:       'pointer',
  },
  langChipActive: {
    background: '#065f46',
    border:     '1px solid #065f46',
    color:      '#fff',
  },

  // Password section
  togglePwBtn: {
    background:   'transparent',
    border:       '1px dashed #10b981',
    color:        '#065f46',
    borderRadius: '8px',
    padding:      '8px 16px',
    cursor:       'pointer',
    fontSize:     '13px',
    fontWeight:   '700',
    textAlign:    'left',
  },
  pwSection: {
    background:   '#f0fdf4',
    border:       '1px solid #bbf7d0',
    borderRadius: '10px',
    padding:      '16px',
    display:      'flex',
    flexDirection:'column',
    gap:          '12px',
  },

  // Buttons
  btnRow: {
    display: 'flex',
    gap:     '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    flex:         1,
    padding:      '11px',
    borderRadius: '8px',
    border:       '1px solid #d1d5db',
    background:   '#fff',
    color:        '#374151',
    fontSize:     '14px',
    fontWeight:   '700',
    cursor:       'pointer',
  },
  saveBtn: {
    flex:         2,
    padding:      '11px',
    borderRadius: '8px',
    border:       'none',
    background:   '#065f46',
    color:        '#fff',
    fontSize:     '14px',
    fontWeight:   '700',
    cursor:       'pointer',
  },
};

export default ProfilePage;
