import { useState }        from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosInstance        from "../utils/axiosInstance";

const ResetPassword = () => {
  const { token }   = useParams();    // from /reset-password/:token
  const navigate    = useNavigate();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPass,  setShowPass]  = useState({ password: false, confirm: false });
  const [status,    setStatus]    = useState("idle"); // idle | loading | success | error | invalid
  const [message,   setMessage]   = useState("");
  const [strength,  setStrength]  = useState(0);      // 0–4 password strength

  // ── Password strength calculator ───────────────────
  const calcStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8)                      score++;
    if (pwd.length >= 12)                     score++;
    if (/[A-Z]/.test(pwd))                    score++;
    if (/[0-9]/.test(pwd))                    score++;
    if (/[^a-zA-Z0-9]/.test(pwd))            score++;
    return Math.min(score, 4);
  };

  const STRENGTH_CONFIG = [
    { label: "Too Short",  color: "#e2e8f0", textColor: "#94a3b8" },
    { label: "Weak",       color: "#ef4444", textColor: "#ef4444" },
    { label: "Fair",       color: "#f59e0b", textColor: "#f59e0b" },
    { label: "Good",       color: "#10b981", textColor: "#10b981" },
    { label: "Strong 💪",  color: "#065f46", textColor: "#065f46" },
  ];

  const handlePasswordChange = (val) => {
    setForm((p) => ({ ...p, password: val }));
    setStrength(val.length > 0 ? calcStrength(val) : 0);
    if (status === "error") setStatus("idle");
  };

  const validate = () => {
    if (!form.password)
      return "Password is required.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setStatus("error");
      setMessage(validationError);
      return;
    }

    if (!token) {
      setStatus("invalid");
      setMessage("Reset token is missing from the URL.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await axiosInstance.post(
        `/auth/reset-password/${token}`,
        { password: form.password }
      );

      setStatus("success");
      setMessage(res.data.message || "Password reset successfully!");

      // ── Auto-redirect to login after 3s ─────────────
      setTimeout(() => navigate("/login", { replace: true }), 3000);

    } catch (err) {
      const errMsg = err.response?.data?.message || "Reset failed. Try again.";

      // ── Token expired or invalid ─────────────────────
      if (
        errMsg.toLowerCase().includes("invalid") ||
        errMsg.toLowerCase().includes("expired")
      ) {
        setStatus("invalid");
      } else {
        setStatus("error");
      }
      setMessage(errMsg);
    }
  };

  // ══════════════════════════════════════════════════
  // ── Success Screen ─────────────────────────────────
  if (status === "success") {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.bigIcon}>✅</div>
          <h2 style={s.title}>Password Reset!</h2>
          <p style={s.successText}>
            Your password has been successfully updated.
            You can now sign in with your new password.
          </p>
          <div style={s.countdownBox}>
            <span style={s.countdownText}>
              ⏱️ Redirecting to login in 3 seconds...
            </span>
          </div>
          <Link to="/login" style={s.fullBtn}>
            → Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  // ── Invalid / Expired Token Screen ─────────────────
  if (status === "invalid") {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.bigIcon}>⏰</div>
          <h2 style={{ ...s.title, color: "#b91c1c" }}>
            Link Expired or Invalid
          </h2>
          <p style={s.successText}>
            {message || "This password reset link is no longer valid."}
            <br /><br />
            Reset links expire after <strong>1 hour</strong> for security.
            Please request a new one.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link to="/forgot-password" style={s.fullBtn}>
              🔑 Request New Reset Link
            </Link>
            <Link
              to="/login"
              style={{ ...s.fullBtn, background: "#f8fafc", color: "#475569", border: "1.5px solid #e2e8f0", boxShadow: "none" }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ───────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* ── Header ──────────────────────────────── */}
        <div style={s.header}>
          <div style={s.headerIcon}>🔒</div>
          <h2 style={s.title}>Set New Password</h2>
          <p style={s.subtitle}>
            Choose a strong password for your account. It must be at least
            8 characters long.
          </p>
        </div>

        {/* ── Error Banner ────────────────────────── */}
        {status === "error" && (
          <div style={s.errorBox}>
            <span>⚠️</span>
            <span>{message}</span>
            <button
              style={s.errClose}
              onClick={() => { setStatus("idle"); setMessage(""); }}
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── New Password ─────────────────────── */}
          <div style={s.fieldGroup}>
            <label style={s.label}>New Password</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>🔒</span>
              <input
                type={showPass.password ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                style={s.input}
                autoFocus
                autoComplete="new-password"
                disabled={status === "loading"}
              />
              <button
                type="button"
                style={s.eyeBtn}
                onClick={() => setShowPass((p) => ({ ...p, password: !p.password }))}
                tabIndex={-1}
              >
                {showPass.password ? "🙈" : "👁️"}
              </button>
            </div>

            {/* ── Password Strength Bar ────────────── */}
            {form.password.length > 0 && (
              <div style={s.strengthWrap}>
                <div style={s.strengthBars}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      style={{
                        ...s.strengthBar,
                        background:
                          level <= strength
                            ? STRENGTH_CONFIG[strength].color
                            : "#e2e8f0",
                      }}
                    />
                  ))}
                </div>
                <span style={{
                  ...s.strengthLabel,
                  color: STRENGTH_CONFIG[strength].textColor,
                }}>
                  {STRENGTH_CONFIG[strength].label}
                </span>
              </div>
            )}

            {/* Password tips */}
            <div style={s.tipsList}>
              {[
                { rule: form.password.length >= 8,       text: "At least 8 characters" },
                { rule: /[A-Z]/.test(form.password),     text: "One uppercase letter" },
                { rule: /[0-9]/.test(form.password),     text: "One number" },
                { rule: /[^a-zA-Z0-9]/.test(form.password), text: "One special character" },
              ].map((tip) => (
                <span
                  key={tip.text}
                  style={{
                    ...s.tip,
                    color:      tip.rule ? "#059669" : "#94a3b8",
                    background: tip.rule ? "#ecfdf5" : "#f8fafc",
                    border:     `1px solid ${tip.rule ? "#a7f3d0" : "#e2e8f0"}`,
                  }}
                >
                  {tip.rule ? "✓" : "○"} {tip.text}
                </span>
              ))}
            </div>
          </div>

          {/* ── Confirm Password ─────────────────── */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Confirm New Password</label>
            <div style={{
              ...s.inputWrap,
              borderColor:
                form.confirmPassword.length > 0
                  ? form.password === form.confirmPassword
                    ? "#10b981"
                    : "#ef4444"
                  : "#e2e8f0",
            }}>
              <span style={s.inputIcon}>🔒</span>
              <input
                type={showPass.confirm ? "text" : "password"}
                placeholder="Re-enter your new password"
                value={form.confirmPassword}
                onChange={(e) => {
                  setForm((p) => ({ ...p, confirmPassword: e.target.value }));
                  if (status === "error") setStatus("idle");
                }}
                style={s.input}
                autoComplete="new-password"
                disabled={status === "loading"}
              />
              <button
                type="button"
                style={s.eyeBtn}
                onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))}
                tabIndex={-1}
              >
                {showPass.confirm ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Match indicator */}
            {form.confirmPassword.length > 0 && (
              <p style={{
                fontSize:  "12px",
                margin:    "5px 0 0",
                fontWeight:"600",
                color: form.password === form.confirmPassword ? "#059669" : "#ef4444",
              }}>
                {form.password === form.confirmPassword
                  ? "✅ Passwords match"
                  : "❌ Passwords do not match"}
              </p>
            )}
          </div>

          {/* ── Submit ───────────────────────────── */}
          <button
            type="submit"
            style={{
              ...s.submitBtn,
              opacity: status === "loading" ? 0.75 : 1,
              cursor:  status === "loading" ? "not-allowed" : "pointer",
            }}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <span style={s.spinner} />
                Resetting Password...
              </>
            ) : (
              "🔐 Reset Password"
            )}
          </button>
        </form>

        {/* ── Footer ──────────────────────────────── */}
        <div style={s.footer}>
          <Link to="/login"          style={s.footerLink}>← Back to Login</Link>
          <span style={s.footerDivider}>•</span>
          <Link to="/forgot-password" style={s.footerLink}>Request New Link</Link>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const s = {
  page: {
    minHeight:       "100vh",
    background:      "linear-gradient(160deg, #064e3b 0%, #065f46 50%, #047857 100%)",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    padding:         "40px 20px",
  },
  card: {
    background:   "#fff",
    borderRadius: "20px",
    padding:      "48px 44px",
    width:        "100%",
    maxWidth:     "480px",
    boxShadow:    "0 20px 60px rgba(0,0,0,0.2)",
    animation:    "fadeUp 0.4s ease",
  },

  // ── Header ───────────────────────────────────────────
  header:     { textAlign: "center", marginBottom: "32px" },
  headerIcon: { fontSize: "50px", display: "block", marginBottom: "14px" },
  title:      { fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 10px" },
  subtitle:   { fontSize: "14px", color: "#64748b", lineHeight: "1.7", margin: 0 },
  bigIcon:    { fontSize: "64px", textAlign: "center", display: "block", marginBottom: "16px" },
  successText:{ fontSize: "14px", color: "#374151", lineHeight: "1.8", textAlign: "center", margin: "0 0 20px" },

  // ── Error ────────────────────────────────────────────
  errorBox: {
    display:      "flex",
    alignItems:   "center",
    gap:          "10px",
    background:   "#fef2f2",
    border:       "1px solid #fecaca",
    borderRadius: "10px",
    padding:      "12px 16px",
    marginBottom: "20px",
    fontSize:     "14px",
    color:        "#b91c1c",
  },
  errClose: {
    marginLeft:  "auto",
    background:  "none",
    border:      "none",
    cursor:      "pointer",
    color:       "#b91c1c",
    fontSize:    "16px",
  },

  // ── Fields ───────────────────────────────────────────
  fieldGroup:  { marginBottom: "22px" },
  label: {
    display:      "block",
    fontSize:     "13px",
    fontWeight:   "700",
    color:        "#374151",
    marginBottom: "7px",
  },
  inputWrap: {
    display:      "flex",
    alignItems:   "center",
    border:       "1.5px solid #e2e8f0",
    borderRadius: "10px",
    overflow:     "hidden",
    background:   "#f8fafc",
    transition:   "border-color 0.2s",
  },
  inputIcon: { padding: "0 14px", fontSize: "17px", flexShrink: 0 },
  input: {
    flex:       1,
    border:     "none",
    outline:    "none",
    background: "transparent",
    padding:    "14px 8px 14px 0",
    fontSize:   "15px",
    color:      "#0f172a",
  },
  eyeBtn: {
    background: "none",
    border:     "none",
    cursor:     "pointer",
    padding:    "0 14px",
    fontSize:   "17px",
    color:      "#94a3b8",
  },

  // ── Password Strength ────────────────────────────────
  strengthWrap: {
    display:    "flex",
    alignItems: "center",
    gap:        "10px",
    marginTop:  "8px",
  },
  strengthBars: { display: "flex", gap: "4px", flex: 1 },
  strengthBar:  { height: "4px", flex: 1, borderRadius: "2px", transition: "background 0.25s" },
  strengthLabel:{ fontSize: "12px", fontWeight: "700", minWidth: "80px" },

  // ── Tips ─────────────────────────────────────────────
  tipsList: {
    display:   "flex",
    gap:       "6px",
    flexWrap:  "wrap",
    marginTop: "10px",
  },
  tip: {
    fontSize:     "11px",
    fontWeight:   "600",
    padding:      "3px 10px",
    borderRadius: "999px",
    transition:   "all 0.2s",
  },

  // ── Submit ───────────────────────────────────────────
  submitBtn: {
    width:          "100%",
    padding:        "14px",
    background:     "linear-gradient(135deg, #065f46, #059669)",
    color:          "#fff",
    border:         "none",
    borderRadius:   "10px",
    fontSize:       "16px",
    fontWeight:     "700",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            "10px",
    boxShadow:      "0 4px 14px rgba(6,95,70,0.35)",
    marginTop:      "8px",
  },
  spinner: {
    width:        "18px",
    height:       "18px",
    border:       "2px solid rgba(255,255,255,0.35)",
    borderTop:    "2px solid #fff",
    borderRadius: "50%",
    animation:    "spin 0.7s linear infinite",
    flexShrink:   0,
  },

  // ── Countdown / Success ──────────────────────────────
  countdownBox: {
    background:   "#ecfdf5",
    border:       "1px solid #a7f3d0",
    borderRadius: "10px",
    padding:      "12px 16px",
    marginBottom: "20px",
    textAlign:    "center",
  },
  countdownText: { fontSize: "13px", color: "#065f46", fontWeight: "600" },

  // ── Buttons ──────────────────────────────────────────
  fullBtn: {
    display:        "block",
    width:          "100%",
    padding:        "14px",
    background:     "linear-gradient(135deg, #065f46, #059669)",
    color:          "#fff",
    border:         "none",
    borderRadius:   "10px",
    fontSize:       "15px",
    fontWeight:     "700",
    textDecoration: "none",
    textAlign:      "center",
    boxShadow:      "0 4px 14px rgba(6,95,70,0.3)",
    marginBottom:   "10px",
  },

  // ── Footer ───────────────────────────────────────────
  footer: {
    display:        "flex",
    justifyContent: "center",
    alignItems:     "center",
    gap:            "12px",
    marginTop:      "28px",
  },
  footerLink:    { color: "#059669", fontWeight: "700", fontSize: "14px", textDecoration: "none" },
  footerDivider: { color: "#cbd5e1" },
};

export default ResetPassword;
