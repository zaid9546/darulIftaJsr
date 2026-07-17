import { useState } from "react";
import { Link }     from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";

const ForgotPassword = () => {
  const [email,     setEmail]     = useState("");
  const [status,    setStatus]    = useState("idle"); // idle | loading | sent | error
  const [message,   setMessage]   = useState("");
  const [devLink,   setDevLink]   = useState("");     // dev-only reset link

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await axiosInstance.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setStatus("sent");
      setMessage(res.data.message || "Reset link sent!");

      // ── Dev only: show clickable reset link in UI ──
      if (res.data.devResetURL) {
        setDevLink(res.data.devResetURL);
      }
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  // ── Success Screen ──────────────────────────────────
  if (status === "sent") {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.successIcon}>📬</div>
          <h2 style={s.title}>Check Your Email</h2>
          <p style={s.successText}>
            If <strong>{email}</strong> is registered in our system, a password
            reset link has been sent. Please check your inbox and spam folder.
          </p>

          <div style={s.infoBox}>
            <p style={s.infoItem}>⏱️ The link expires in <strong>1 hour</strong></p>
            <p style={s.infoItem}>📧 Check your spam/junk folder if not visible</p>
            <p style={s.infoItem}>🔄 You can request another link after the link expires</p>
          </div>

          {/* ── DEV ONLY: show reset URL for testing ── */}
          {devLink && (
            <div style={s.devBox}>
              <p style={s.devLabel}>🛠️ DEV MODE — Reset Link (remove in production):</p>
              <a
                href={devLink}
                style={s.devLink}
                target="_blank"
                rel="noreferrer"
              >
                {devLink}
              </a>
            </div>
          )}

          <div style={s.actionRow}>
            <button
              style={s.secondaryBtn}
              onClick={() => {
                setStatus("idle");
                setEmail("");
                setDevLink("");
                setMessage("");
              }}
            >
              ← Try Different Email
            </button>
            <Link to="/login" style={s.primaryBtn}>
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
          <div style={s.headerIcon}>🔑</div>
          <h2 style={s.title}>Forgot Password?</h2>
          <p style={s.subtitle}>
            No worries! Enter your registered email and we will send you a
            secure reset link.
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

        {/* ── Form ────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={s.fieldGroup}>
            <label style={s.label}>Email Address</label>
            <div style={{
              ...s.inputWrap,
              borderColor: status === "error" ? "#ef4444" : "#e2e8f0",
            }}>
              <span style={s.inputIcon}>✉️</span>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                style={s.input}
                autoFocus
                autoComplete="email"
                disabled={status === "loading"}
              />
            </div>
          </div>

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
                Sending Reset Link...
              </>
            ) : (
              "📨 Send Reset Link"
            )}
          </button>
        </form>

        {/* ── Footer Links ────────────────────────── */}
        <div style={s.footer}>
          <Link to="/login" style={s.footerLink}>
            ← Back to Login
          </Link>
          <span style={s.footerDivider}>•</span>
          <Link to="/fatwas" style={s.footerLink}>
            Browse Fatwas
          </Link>
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
    maxWidth:     "460px",
    boxShadow:    "0 20px 60px rgba(0,0,0,0.2)",
    animation:    "fadeUp 0.4s ease",
  },

  // ── Header ───────────────────────────────────────────
  header:     { textAlign: "center", marginBottom: "32px" },
  headerIcon: { fontSize: "52px", marginBottom: "16px", display: "block" },
  title:      { fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 10px" },
  subtitle:   { fontSize: "14px", color: "#64748b", lineHeight: "1.7", margin: 0 },

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

  // ── Field ────────────────────────────────────────────
  fieldGroup:  { marginBottom: "20px" },
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
  },
  inputIcon: { padding: "0 14px", fontSize: "17px", flexShrink: 0 },
  input: {
    flex:       1,
    border:     "none",
    outline:    "none",
    background: "transparent",
    padding:    "14px 12px 14px 0",
    fontSize:   "15px",
    color:      "#0f172a",
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

  // ── Success ──────────────────────────────────────────
  successIcon: { fontSize: "64px", textAlign: "center", display: "block", marginBottom: "16px" },
  successText: {
    fontSize:   "14px",
    color:      "#374151",
    lineHeight: "1.8",
    textAlign:  "center",
    margin:     "0 0 20px",
  },
  infoBox: {
    background:   "#f0fdf4",
    border:       "1px solid #bbf7d0",
    borderRadius: "12px",
    padding:      "16px 20px",
    marginBottom: "24px",
  },
  infoItem: { fontSize: "13px", color: "#065f46", margin: "0 0 6px", lineHeight: "1.6" },

  // ── Dev Box (development only) ───────────────────────
  devBox: {
    background:   "#fffbeb",
    border:       "1.5px dashed #f59e0b",
    borderRadius: "10px",
    padding:      "14px 18px",
    marginBottom: "20px",
  },
  devLabel: { fontSize: "12px", fontWeight: "700", color: "#92400e", margin: "0 0 8px" },
  devLink: {
    fontSize:      "12px",
    color:         "#2563eb",
    wordBreak:     "break-all",
    fontFamily:    "monospace",
    display:       "block",
    textDecoration:"underline",
  },

  // ── Action Row ───────────────────────────────────────
  actionRow: {
    display:  "flex",
    gap:      "12px",
    flexWrap: "wrap",
  },
  primaryBtn: {
    flex:           1,
    padding:        "12px 20px",
    background:     "linear-gradient(135deg, #065f46, #059669)",
    color:          "#fff",
    border:         "none",
    borderRadius:   "10px",
    fontWeight:     "700",
    fontSize:       "14px",
    textDecoration: "none",
    textAlign:      "center",
    boxShadow:      "0 3px 10px rgba(6,95,70,0.3)",
  },
  secondaryBtn: {
    flex:         1,
    padding:      "12px 20px",
    background:   "#f8fafc",
    color:        "#475569",
    border:       "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontWeight:   "700",
    fontSize:     "14px",
    cursor:       "pointer",
  },
};

export default ForgotPassword;
