import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  loginUser,
  clearAuthError,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectUser,
} from "../features/auth/authSlice";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [fieldErr, setFieldErr] = useState({});

  // ── Redirect if already logged in ─────────────────
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "super_admin" ? "/admin" : "/mufti", {
        replace: true,
      });
    }
  }, [isAuthenticated, user, navigate]);

  // ── Clear API error on unmount ─────────────────────
  useEffect(() => {
    return () => dispatch(clearAuthError());
  }, [dispatch]);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Enter a valid email.";
    if (!form.password) errs.password = "Password is required.";
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(loginUser({ email: form.email, password: form.password }));
  };

  const handleChange = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (fieldErr[key]) setFieldErr((p) => ({ ...p, [key]: "" }));
    if (error) dispatch(clearAuthError());
  };

  return (
    <div style={s.page}>
      {/* ── Left Panel (branding) ──────────────────── */}
      <div style={s.leftPanel}>
        <div style={s.leftInner}>
          <div style={s.arabicBrand}>نظام إدارة الفتاوى</div>
          <h1 style={s.brandTitle}>Darulifta Jamshedpur</h1>
          <p style={s.brandSub}>
            A secure platform for qualified Muftis and administrators to manage
            Islamic rulings with integrity and accountability.
          </p>
          <div style={s.featureList}>
            {[
              "🔐 Role-based secure access",
              "📋 Complete question workflow",
              "🔏 Digital approval stamps",
              "📄 Official PDF generation",
              "🌍 Urdu · Hindi · English",
            ].map((f) => (
              <div key={f} style={s.featureItem}>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel (form) ────────────────────── */}
      <div style={s.rightPanel}>
        <div style={s.formCard}>
          {/* Header */}
          <div style={s.formHeader}>
            <div style={s.logoCircle}>🕌</div>
            <h2 style={s.formTitle}>Staff Login</h2>
            <p style={s.formSub}>Sign in to your account</p>
          </div>

          {/* API Error */}
          {error && (
            <div style={s.apiError}>
              <span>⚠️</span>
              <span>{error}</span>
              <button
                style={s.errClose}
                onClick={() => dispatch(clearAuthError())}
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Email Address</label>
              <div
                style={{
                  ...s.inputWrap,
                  borderColor: fieldErr.email ? "#ef4444" : "#e2e8f0",
                }}
              >
                <span style={s.inputIcon}>✉️</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  style={s.input}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {fieldErr.email && (
                <p style={s.fieldErrTxt}>⚠ {fieldErr.email}</p>
              )}
            </div>

            {/* ── Password ── */}
            <div style={s.fieldGroup}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                {/* ✅ Override marginBottom to 0 since the wrapper div handles spacing */}
                <label style={{ ...s.label, marginBottom: 0 }}>Password</label>

                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: "12px",
                    color: "#059669",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  Forgot password?
                </Link>
              </div>

              <div
                style={{
                  ...s.inputWrap,
                  borderColor: fieldErr.password ? "#ef4444" : "#e2e8f0",
                }}
              >
                <span style={s.inputIcon}>🔒</span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  style={s.input}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowPass((p) => !p)}
                  tabIndex={-1}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              {fieldErr.password && (
                <p style={s.fieldErrTxt}>⚠ {fieldErr.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={s.spinner} />
                  Signing in...
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          {/* Footer note */}
          <div style={s.formFooter}>
            <p style={s.footerNote}>
              🔒 This portal is for <strong>authorized staff only</strong>.
              <br />
              Public users can{" "}
              <Link to="/submit" style={s.link}>
                submit a question
              </Link>{" "}
              or{" "}
              <Link to="/fatwas" style={s.link}>
                browse Fatwas
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
  },
  // ── Left Panel ──────────────────────────────────────
  leftPanel: {
    flex: "0 0 45%",
    background:
      "linear-gradient(160deg, #064e3b 0%, #065f46 50%, #047857 100%)",
    display: "flex",
    alignItems: "center",
    padding: "60px 48px",
  },
  leftInner: { maxWidth: "400px" },
  arabicBrand: {
    fontFamily: "'Noto Nastaliq Urdu', serif",
    fontSize: "28px",
    color: "#a7f3d0",
    direction: "rtl",
    lineHeight: "2",
    marginBottom: "8px",
  },
  brandTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#fff",
    margin: "0 0 16px",
    lineHeight: "1.3",
  },
  brandSub: {
    fontSize: "15px",
    color: "#6ee7b7",
    lineHeight: "1.7",
    margin: "0 0 36px",
  },
  featureList: { display: "flex", flexDirection: "column", gap: "12px" },
  featureItem: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px",
    padding: "10px 16px",
    color: "#d1fae5",
    fontSize: "14px",
    fontWeight: "600",
  },

  // ── Right Panel ─────────────────────────────────────
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    padding: "40px 20px",
  },
  formCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "48px 44px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
    border: "1px solid #f1f5f9",
  },
  formHeader: { textAlign: "center", marginBottom: "32px" },
  logoCircle: {
    fontSize: "44px",
    display: "block",
    marginBottom: "12px",
  },
  formTitle: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 6px",
  },
  formSub: { fontSize: "14px", color: "#64748b", margin: 0 },

  // ── Error ────────────────────────────────────────────
  apiError: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "20px",
    fontSize: "14px",
    color: "#b91c1c",
  },
  errClose: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#b91c1c",
    fontSize: "14px",
  },

  // ── Fields ───────────────────────────────────────────
  fieldGroup: { marginBottom: "20px" },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "700",
    color: "#374151",
    marginBottom: "6px",
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#f8fafc",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  inputIcon: {
    padding: "0 12px",
    fontSize: "16px",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "13px 12px 13px 0",
    fontSize: "15px",
    color: "#0f172a",
  },
  eyeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0 14px",
    fontSize: "16px",
    color: "#94a3b8",
  },
  fieldErrTxt: {
    fontSize: "12px",
    color: "#ef4444",
    margin: "5px 0 0",
  },

  // ── Submit ───────────────────────────────────────────
  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #065f46, #059669)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "8px",
    boxShadow: "0 4px 14px rgba(6,95,70,0.35)",
    transition: "opacity 0.2s",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.35)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  },

  // ── Footer ───────────────────────────────────────────
  formFooter: { marginTop: "28px", textAlign: "center" },
  footerNote: { fontSize: "13px", color: "#94a3b8", lineHeight: "1.8" },
  link: { color: "#059669", fontWeight: "700", textDecoration: "none" },
};

export default LoginPage;
