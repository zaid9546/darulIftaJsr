import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  submitQuestion,
  clearSubmitResult,
  clearQuestionError,
  selectQLoading,
  selectQError,
  selectSubmitResult,
  selectSuccessMessage,
} from '../features/questions/questionSlice';

// ── RTL languages ──────────────────────────────────────
const RTL_LANGUAGES = ['urdu', 'hindi'];

const CATEGORIES = [
  { value: 'prayer',   label: '🕌 Prayer (Salah)' },
  { value: 'fasting',  label: '🌙 Fasting (Sawm)' },
  { value: 'zakat',    label: '💰 Zakat' },
  { value: 'hajj',     label: '🕋 Hajj' },
  { value: 'marriage', label: '💍 Marriage (Nikah)' },
  { value: 'divorce',  label: '📜 Divorce (Talaq)' },
  { value: 'finance',  label: '🏦 Islamic Finance' },
  { value: 'food',     label: '🍽️ Food (Halal/Haram)' },
  { value: 'worship',  label: '📿 Worship (Ibadah)' },
  { value: 'other',    label: '❓ Other' },
];

const LANGUAGES = [
  { value: 'english', label: '🇬🇧 English' },
  { value: 'urdu',    label: '🇵🇰 Urdu (اردو)' },
  { value: 'hindi',   label: '🇮🇳 Hindi (हिन्दी)' },
];

const PLACEHOLDERS = {
  english: 'Type your question here in detail...',
  urdu:    'یہاں اپنا سوال تفصیل سے لکھیں...',
  hindi:   'यहाँ अपना सवाल विस्तार से लिखें...',
};

const SubmitQuestion = () => {
  const dispatch       = useDispatch();
  const loading        = useSelector(selectQLoading);
  const error          = useSelector(selectQError);
  const submitResult   = useSelector(selectSubmitResult);
  const successMessage = useSelector(selectSuccessMessage);

  const [form, setForm] = useState({
    questionText: '',
    language:     'english',
    category:     'other',
    tags:         '',
    isAnonymous:  true,
    name:         '',
    email:        '',
    phone:        '',
  });

  // ── Cleanup on unmount ─────────────────────────────
  useEffect(() => {
    return () => {
      dispatch(clearSubmitResult());
      dispatch(clearQuestionError());
    };
  }, [dispatch]);

  const isRTL = RTL_LANGUAGES.includes(form.language);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    dispatch(clearQuestionError());
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      questionText: form.questionText.trim(),
      language:     form.language,
      category:     form.category,
      tags:         form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      submittedBy: {
        isAnonymous: form.isAnonymous,
        name:        form.isAnonymous ? undefined : form.name,
        email:       form.isAnonymous ? undefined : form.email,
        phone:       form.isAnonymous ? undefined : form.phone,
      },
    };

    dispatch(submitQuestion(payload));
  };

  // ── Success State ──────────────────────────────────
  if (submitResult) {
    return (
      <div style={s.page}>
        <div style={s.successCard}>
          <div style={s.successIcon}>✅</div>
          <h2 style={s.successTitle}>Question Submitted!</h2>
          <p style={s.successMsg}>{successMessage}</p>
          <div style={s.refBox}>
            <span style={s.refLabel}>Your Reference ID:</span>
            <code style={s.refCode}>{submitResult._id}</code>
          </div>
          <button
            style={s.newBtn}
            onClick={() => dispatch(clearSubmitResult())}
          >
            ✉️ Submit Another Question
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* ── Header ──────────────────────────────── */}
        <div style={s.header}>
          <h1 style={s.title}>✉️ Ask a Question</h1>
          <p style={s.subtitle}>
            Submit your Islamic question. Our qualified Muftis will respond promptly.
          </p>
        </div>

        {/* ── Error ───────────────────────────────── */}
        {error && <div style={s.errorBanner}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>

          {/* ── Language Selector ───────────────────── */}
          <div style={s.field}>
            <label style={s.label}>🌍 Language</label>
            <div style={s.langGroup}>
              {LANGUAGES.map((lang) => (
                <label key={lang.value} style={{
                  ...s.langBtn,
                  ...(form.language === lang.value ? s.langBtnActive : {}),
                }}>
                  <input
                    type="radio"
                    name="language"
                    value={lang.value}
                    checked={form.language === lang.value}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  {lang.label}
                </label>
              ))}
            </div>
          </div>

          {/* ── Category ────────────────────────────── */}
          <div style={s.field}>
            <label style={s.label}>📂 Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={s.select}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Question Text (RTL-aware) ───────────── */}
          <div style={s.field}>
            <label style={s.label}>📝 Your Question</label>
            <textarea
              name="questionText"
              value={form.questionText}
              onChange={handleChange}
              placeholder={PLACEHOLDERS[form.language]}
              style={{
                ...s.textarea,
                direction: isRTL ? 'rtl' : 'ltr',
                textAlign: isRTL ? 'right' : 'left',
                fontFamily: isRTL
                  ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif"
                  : 'inherit',
                fontSize:  isRTL ? '16px' : '14px',
                lineHeight: isRTL ? '2.2' : '1.6',
              }}
              required
              minLength={10}
              maxLength={5000}
            />
            <span style={s.charCount}>
              {form.questionText.length} / 5000
            </span>
          </div>

          {/* ── Tags ────────────────────────────────── */}
          <div style={s.field}>
            <label style={s.label}>🏷️ Tags (optional, comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g. wudu, prayer, purification"
              style={s.input}
            />
          </div>

          {/* ── Anonymous Toggle ────────────────────── */}
          <div style={s.toggleRow}>
            <label style={s.toggleLabel}>
              <input
                type="checkbox"
                name="isAnonymous"
                checked={form.isAnonymous}
                onChange={handleChange}
                style={s.checkbox}
              />
              <span>🕵️ Submit Anonymously</span>
            </label>
            <p style={s.toggleHint}>
              {form.isAnonymous
                ? 'Your identity will not be recorded.'
                : 'Your contact details will be kept private.'}
            </p>
          </div>

          {/* ── Contact Info (if not anonymous) ──────── */}
          {!form.isAnonymous && (
            <div style={s.contactBox}>
              <div style={s.contactGrid}>
                <div style={s.field}>
                  <label style={s.label}>👤 Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    style={s.input}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>📧 Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    style={s.input}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>📱 Phone (optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+92 300 0000000"
                    style={s.input}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Submit Button ────────────────────────── */}
          <button
            type="submit"
            style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
            disabled={loading || form.questionText.trim().length < 10}
          >
            {loading ? '⏳ Submitting...' : '🚀 Submit Question'}
          </button>
        </form>
      </div>
    </div>
  );
};

const s = {
  page:         { minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', display: 'flex', justifyContent: 'center' },
  card:         { background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '680px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', alignSelf: 'flex-start' },
  header:       { marginBottom: '32px' },
  title:        { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px' },
  subtitle:     { color: '#64748b', fontSize: '15px', margin: 0, lineHeight: '1.5' },
  errorBanner:  { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  form:         { display: 'flex', flexDirection: 'column', gap: '24px' },
  field:        { display: 'flex', flexDirection: 'column', gap: '6px' },
  label:        { fontSize: '13px', fontWeight: '600', color: '#374151' },
  langGroup:    { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  langBtn:      { padding: '8px 18px', borderRadius: '999px', border: '2px solid #e2e8f0', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#64748b', transition: 'all 0.2s', userSelect: 'none' },
  langBtnActive:{ background: '#10b981', borderColor: '#10b981', color: '#fff' },
  select:       { padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none' },
  textarea:     { padding: '14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', minHeight: '160px', resize: 'vertical', outline: 'none', color: '#0f172a' },
  charCount:    { fontSize: '11px', color: '#94a3b8', textAlign: 'right' },
  input:        { padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#0f172a' },
  toggleRow:    { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 16px' },
  toggleLabel:  { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', color: '#166534', fontSize: '14px' },
  toggleHint:   { margin: '6px 0 0 28px', fontSize: '12px', color: '#4b7c5e' },
  checkbox:     { width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' },
  contactBox:   { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' },
  contactGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  submitBtn:    { background: '#10b981', color: '#fff', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' },
  successCard:  { background: '#fff', borderRadius: '16px', padding: '60px 40px', textAlign: 'center', maxWidth: '480px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  successIcon:  { fontSize: '64px', marginBottom: '16px' },
  successTitle: { fontSize: '24px', fontWeight: '700', color: '#065f46', margin: '0 0 12px' },
  successMsg:   { color: '#374151', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px' },
  refBox:       { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 20px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '6px' },
  refLabel:     { fontSize: '12px', color: '#6b7280', fontWeight: '600' },
  refCode:      { fontSize: '13px', color: '#065f46', fontFamily: 'monospace', wordBreak: 'break-all' },
  newBtn:       { background: '#10b981', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
};

export default SubmitQuestion;
