import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  registerUser,
  clearAuthError,
  clearRegisterSuccess,
  selectAuthLoading,
  selectAuthError,
  selectRegisterSuccess,
} from "../features/auth/authSlice";

const LANGUAGES   = ["english", "urdu", "hindi"];
const SPECIALIZATIONS = [
  "Fiqh Al-Ibadat (Worship)",
  "Fiqh Al-Muamalat (Transactions)",
  "Fiqh Al-Usrah (Family Law)",
  "Hadith Studies",
  "Tafsir & Quranic Sciences",
  "Islamic Finance",
  "General Islamic Jurisprudence",
  "Other",
];

const RegisterPage = () => {
  const dispatch         = useDispatch();
  const navigate         = useNavigate();
  const loading          = useSelector(selectAuthLoading);
  const error            = useSelector(selectAuthError);
  const registerSuccess  = useSelector(selectRegisterSuccess);

  const [form, setForm] = useState({
    name:           "",
    email:          "",
    password:       "",
    confirmPassword:"",
    role:           "mufti",
    specialization: "",
    languages:      [],
    bio:            "",
  });
  const [showPass,  setShowPass]  = useState(false);
  const [fieldErr,  setFieldErr]  = useState({});
  const [step,      setStep]      = useState(1);   // 2-step form

  useEffect(() => { return () => { dispatch(clearAuthError()); dispatch(clearRegisterSuccess()); }; }, [dispatch]);

  // ── Auto-navigate on success ──────────────────────
  useEffect(() => {
    if (registerSuccess) {
      const t = setTimeout(() => {
        dispatch(clearRegisterSuccess());
        navigate("/admin/muftis");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [registerSuccess, dispatch, navigate]);

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (fieldErr[key]) setFieldErr((p) => ({ ...p, [key]: "" }));
    if (error) dispatch(clearAuthError());
  };

  const toggleLang = (lang) => {
    setForm((p) => ({
      ...p,
      languages: p.languages.includes(lang)
        ? p.languages.filter((l) => l !== lang)
        : [...p.languages, lang],
    }));
  };

  // ── Step 1 validation ─────────────────────────────
  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim())  errs.name  = "Full name is required.";
    if (!form.email)        errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email.";
    if (!form.password)     errs.password = "Password is required.";
    else if (form.password.length < 8) errs.password = "Minimum 8 characters.";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match.";
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Step 2 validation ─────────────────────────────
  const validateStep2 = () => {
    const errs = {};
    if (!form.specialization) errs.specialization = "Please select a specialization.";
    if (form.languages.length === 0) errs.languages = "Select at least one language.";
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    dispatch(registerUser({
      name:           form.name.trim(),
      email:          form.email.trim(),
      password:       form.password,
      role:           form.role,
      specialization: form.specialization,
      languages:      form.languages,
      bio:            form.bio.trim(),
    }));
  };

  // ── Success Screen ────────────────────────────────
  if (registerSuccess) {
    return (
      <div style={s.page}>
        <div style={s.successCard}>
          <div style={{ fontSize: "72px", marginBottom: "20px" }}>✅</div>
          <h2 style={s.successTitle}>Mufti Account Created!</h2>
          <p style={s.successSub}>
            <strong>{form.name}</strong>'s account has been registered successfully.
            They can now log in with their email and password.
          </p>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "16px" }}>
            Redirecting to Mufti Management...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.formCard}>

        {/* ── Header ────────────────────────────────── */}
        <div style={s.header}>
          <Link to="/admin/muftis" style={s.backLink}>← Back</Link>
          <div style={s.stepBadge}>Step {step} of 2</div>
        </div>

        <h2 style={s.title}>➕ Register New Mufti</h2>
        <p style={s.subtitle}>
          Create a new Mufti account. This account will have access to the Mufti Dashboard only.
        </p>

        {/* ── Step Indicator ─────────────────────────── */}
        <div style={s.stepRow}>
          {["Account Details", "Profile Info"].map((label, i) => (
            <div key={i} style={s.stepItem}>
              <div style={{
                ...s.stepCircle,
                background: i + 1 <= step ? "#065f46" : "#e2e8f0",
                color:      i + 1 <= step ? "#fff"    : "#94a3b8",
              }}>
                {i + 1 < step ? "✓" : i + 1}
              </div>
              <span style={{ ...s.stepLabel, color: i + 1 <= step ? "#065f46" : "#94a3b8" }}>
                {label}
              </span>
            </div>
          ))}
          <div style={s.stepLine} />
        </div>

        {/* ── API Error ─────────────────────────────── */}
        {error && (
          <div style={s.apiError}>
            ⚠️ {error}
            <button style={s.errClose} onClick={() => dispatch(clearAuthError())}>✕</button>
          </div>
        )}

        {/* ════════════ STEP 1 ════════════ */}
        {step === 1 && (
          <div>
            <Field label="Full Name" error={fieldErr.name}>
              <InputWrap icon="👤" error={fieldErr.name}>
                <input
                  style={s.input}
                  placeholder="Mufti Muhammad Abdullah"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  autoFocus
                />
              </InputWrap>
            </Field>

            <Field label="Email Address" error={fieldErr.email}>
              <InputWrap icon="✉️" error={fieldErr.email}>
                <input
                  type="email"
                  style={s.input}
                  placeholder="mufti@example.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </InputWrap>
            </Field>

            <Field label="Role" error="">
              <div style={s.roleRow}>
                {[
                  { value: "mufti",       label: "🧕 Mufti",       desc: "Can answer questions" },
                  { value: "super_admin", label: "🛡️ Super Admin", desc: "Full system access" },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    style={{
                      ...s.roleCard,
                      ...(form.role === r.value ? s.roleCardActive : {}),
                    }}
                    onClick={() => setField("role", r.value)}
                  >
                    <span style={{ fontSize: "20px" }}>{r.label.split(" ")[0]}</span>
                    <div>
                      <p style={s.roleLabel}>{r.label.split(" ").slice(1).join(" ")}</p>
                      <p style={s.roleDesc}>{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Password" error={fieldErr.password}>
              <InputWrap icon="🔒" error={fieldErr.password}>
                <input
                  type={showPass ? "text" : "password"}
                  style={s.input}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                />
                <button type="button" style={s.eyeBtn} onClick={() => setShowPass((p) => !p)}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </InputWrap>
            </Field>

            <Field label="Confirm Password" error={fieldErr.confirmPassword}>
              <InputWrap icon="🔒" error={fieldErr.confirmPassword}>
                <input
                  type="password"
                  style={s.input}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                />
              </InputWrap>
            </Field>

            <button style={s.submitBtn} type="button" onClick={handleNext}>
              Next: Profile Info →
            </button>
          </div>
        )}

        {/* ════════════ STEP 2 ════════════ */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <Field label="Specialization" error={fieldErr.specialization}>
              <div style={s.selectWrap}>
                <select
                  style={s.select}
                  value={form.specialization}
                  onChange={(e) => setField("specialization", e.target.value)}
                >
                  <option value="">— Select Specialization —</option>
                  {SPECIALIZATIONS.map((sp) => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>
              {fieldErr.specialization && <p style={s.fieldErrTxt}>⚠ {fieldErr.specialization}</p>}
            </Field>

            <Field label="Languages" error={fieldErr.languages}>
              <div style={s.langRow}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    style={{
                      ...s.langChip,
                      ...(form.languages.includes(lang) ? s.langChipActive : {}),
                    }}
                    onClick={() => toggleLang(lang)}
                  >
                    {lang === "urdu" ? "🇵🇰 Urdu" : lang === "hindi" ? "🇮🇳 Hindi" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
              {fieldErr.languages && <p style={s.fieldErrTxt}>⚠ {fieldErr.languages}</p>}
            </Field>

            <Field label="Short Bio (optional)" error="">
              <textarea
                style={s.textarea}
                rows={3}
                placeholder="Brief professional background..."
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
              />
            </Field>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                style={s.backBtn}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                type="submit"
                style={{ ...s.submitBtn, flex: 1, opacity: loading ? 0.75 : 1 }}
                disabled={loading}
              >
                {loading ? "Creating Account..." : "✅ Create Mufti Account"}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

// ── Tiny helper components ─────────────────────────────
const Field = ({ label, error, children }) => (
  <div style={{ marginBottom: "18px" }}>
    <label style={{ display:"block", fontSize:"13px", fontWeight:"700", color:"#374151", marginBottom:"6px" }}>
      {label}
    </label>
    {children}
    {error && <p style={{ fontSize:"12px", color:"#ef4444", margin:"5px 0 0" }}>⚠ {error}</p>}
  </div>
);

const InputWrap = ({ icon, error, children }) => (
  <div style={{
    display:"flex", alignItems:"center",
    border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
    borderRadius:"10px", overflow:"hidden", background:"#f8fafc",
  }}>
    <span style={{ padding:"0 12px", fontSize:"15px", flexShrink:0 }}>{icon}</span>
    {children}
  </div>
);

const s = {
  page:         { minHeight:"100vh", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" },
  formCard:     { background:"#fff", borderRadius:"20px", padding:"40px 44px", width:"100%", maxWidth:"560px", boxShadow:"0 8px 40px rgba(0,0,0,0.10)", border:"1px solid #f1f5f9" },
  successCard:  { background:"#fff", borderRadius:"20px", padding:"60px 40px", maxWidth:"480px", textAlign:"center", boxShadow:"0 8px 40px rgba(0,0,0,0.10)" },
  successTitle: { fontSize:"26px", fontWeight:"800", color:"#065f46", margin:"0 0 12px" },
  successSub:   { fontSize:"15px", color:"#374151", lineHeight:"1.7", margin:0 },
  header:       { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" },
  backLink:     { color:"#059669", fontWeight:"700", fontSize:"14px", textDecoration:"none" },
  stepBadge:    { background:"#ecfdf5", color:"#065f46", border:"1px solid #a7f3d0", padding:"4px 12px", borderRadius:"999px", fontSize:"12px", fontWeight:"700" },
  title:        { fontSize:"24px", fontWeight:"800", color:"#0f172a", margin:"0 0 6px" },
  subtitle:     { fontSize:"14px", color:"#64748b", margin:"0 0 28px", lineHeight:"1.6" },
  stepRow:      { display:"flex", gap:"0", marginBottom:"32px", position:"relative", alignItems:"center" },
  stepItem:     { display:"flex", alignItems:"center", gap:"8px", flex:1, zIndex:1 },
  stepCircle:   { width:"30px", height:"30px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:"800", flexShrink:0, transition:"all 0.2s" },
  stepLabel:    { fontSize:"12px", fontWeight:"700", whiteSpace:"nowrap" },
  stepLine:     { position:"absolute", left:"15px", right:"15px", height:"2px", background:"#e2e8f0", zIndex:0 },
  apiError:     { display:"flex", alignItems:"center", gap:"10px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"10px", padding:"12px 16px", marginBottom:"20px", fontSize:"14px", color:"#b91c1c" },
  errClose:     { marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#b91c1c" },
  input:        { flex:1, border:"none", outline:"none", background:"transparent", padding:"13px 12px 13px 0", fontSize:"15px", color:"#0f172a" },
  eyeBtn:       { background:"none", border:"none", cursor:"pointer", padding:"0 14px", fontSize:"16px", color:"#94a3b8" },
  fieldErrTxt:  { fontSize:"12px", color:"#ef4444", margin:"5px 0 0" },
  selectWrap:   { border:"1.5px solid #e2e8f0", borderRadius:"10px", overflow:"hidden", background:"#f8fafc" },
  select:       { width:"100%", padding:"13px 16px", border:"none", outline:"none", background:"transparent", fontSize:"15px", color:"#0f172a", cursor:"pointer" },
  textarea:     { width:"100%", padding:"12px 16px", border:"1.5px solid #e2e8f0", borderRadius:"10px", outline:"none", fontSize:"14px", color:"#0f172a", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit", background:"#f8fafc" },
  roleRow:      { display:"flex", gap:"12px" },
  roleCard:     { flex:1, display:"flex", alignItems:"center", gap:"12px", padding:"14px 16px", border:"1.5px solid #e2e8f0", borderRadius:"10px", background:"#f8fafc", cursor:"pointer", textAlign:"left", transition:"all 0.15s" },
  roleCardActive:{ border:"1.5px solid #065f46", background:"#ecfdf5", boxShadow:"0 0 0 3px rgba(6,95,70,0.12)" },
  roleLabel:    { fontSize:"14px", fontWeight:"700", color:"#0f172a", margin:"0 0 2px" },
  roleDesc:     { fontSize:"12px", color:"#64748b", margin:0 },
  langRow:      { display:"flex", gap:"10px", flexWrap:"wrap" },
  langChip:     { padding:"8px 20px", borderRadius:"999px", border:"1.5px solid #e2e8f0", background:"#f8fafc", color:"#475569", fontSize:"14px", fontWeight:"600", cursor:"pointer", transition:"all 0.15s" },
  langChipActive:{ border:"1.5px solid #065f46", background:"#065f46", color:"#fff", boxShadow:"0 2px 8px rgba(6,95,70,0.3)" },
  submitBtn:    { width:"100%", padding:"14px", background:"linear-gradient(135deg,#065f46,#059669)", color:"#fff", border:"none", borderRadius:"10px", fontSize:"16px", fontWeight:"700", cursor:"pointer", boxShadow:"0 4px 14px rgba(6,95,70,0.35)", marginTop:"8px" },
  backBtn:      { padding:"14px 24px", border:"1.5px solid #e2e8f0", background:"#f8fafc", color:"#475569", borderRadius:"10px", fontSize:"15px", fontWeight:"700", cursor:"pointer" },
};

export default RegisterPage;
