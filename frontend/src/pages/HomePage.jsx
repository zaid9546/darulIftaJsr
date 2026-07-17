import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "../features/auth/authSlice";
import axiosInstance from "../utils/axiosInstance";

const HomePage = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user            = useSelector(selectUser);
  const [stats, setStats]   = useState(null);

  // ── Fetch public stats ─────────────────────────────
  useEffect(() => {
    axiosInstance.get("/questions/public/stats")
      .then((r) => setStats(r.data.data))
      .catch(() => setStats({ total: 0, languages: {} }));
  }, []);

  const dashLink = user?.role === "super_admin" ? "/admin" : "/mufti";

  return (
    <div style={s.page}>

      {/* ════ HERO ══════════════════════════════════ */}
      <section style={s.hero}>
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          <div style={s.bismillah}>بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
          <h1 style={s.heroTitle}>Darulifta Jamshedpur</h1>
          <p style={s.heroSub}>
            Ask Islamic questions in Urdu, Hindi or English — and receive verified rulings
            from qualified Muftis, sealed with an official digital stamp.
          </p>
          <div style={s.heroBtns}>
            <Link to="/submit" style={s.btnPrimary}>
              ✍️ Submit a Question
            </Link>
            <Link to="/fatwas" style={s.btnOutline}>
              📖 Browse Fatwas
            </Link>
            {isAuthenticated && (
              <Link to={dashLink} style={s.btnDash}>
                🛠️ Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ════ STATS BAR ═════════════════════════════ */}
      {stats && (
        <section style={s.statsBar}>
          {[
            { icon: "📋", num: stats.total || "—",               label: "Fatwas Published" },
            { icon: "🇵🇰", num: stats.languages?.urdu    || "—", label: "In Urdu" },
            { icon: "🇮🇳", num: stats.languages?.hindi   || "—", label: "In Hindi" },
            { icon: "🇬🇧", num: stats.languages?.english || "—", label: "In English" },
          ].map((st) => (
            <div key={st.label} style={s.statItem}>
              <span style={s.statIcon}>{st.icon}</span>
              <span style={s.statNum}>{st.num}</span>
              <span style={s.statLabel}>{st.label}</span>
            </div>
          ))}
        </section>
      )}

      {/* ════ HOW IT WORKS ══════════════════════════ */}
      <section style={s.section}>
        <div style={s.sectionInner}>
          <h2 style={s.sectionTitle}>⚙️ How It Works</h2>
          <p style={s.sectionSub}>
            A transparent 4-step process from question to published Fatwa
          </p>
          <div style={s.stepsGrid}>
            {[
              { n:"1", icon:"✍️",  color:"#2563eb", bg:"#eff6ff", title:"Submit",  desc:"Anyone submits a question in Urdu, Hindi, or English — anonymously or with contact details." },
              { n:"2", icon:"📋",  color:"#7c3aed", bg:"#f5f3ff", title:"Assign",  desc:"The Super Admin reviews the question and assigns it to the most suitable qualified Mufti." },
              { n:"3", icon:"📜",  color:"#059669", bg:"#ecfdf5", title:"Answer",  desc:"The Mufti researches and submits a detailed answer with references from Quran and Hadith." },
              { n:"4", icon:"🔏",  color:"#065f46", bg:"#f0fdf4", title:"Publish", desc:"Admin approves the ruling. A unique Fatwa Number, date and official digital stamp are generated." },
            ].map((step) => (
              <div key={step.n} style={s.stepCard}>
                <div style={{ ...s.stepIconBox, background: step.bg, color: step.color }}>
                  {step.icon}
                </div>
                <div style={{ ...s.stepNum, color: step.color }}>Step {step.n}</div>
                <h3 style={s.stepTitle}>{step.title}</h3>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FEATURES ══════════════════════════════ */}
      <section style={{ ...s.section, background: "#f0fdf4" }}>
        <div style={s.sectionInner}>
          <h2 style={s.sectionTitle}>✨ Key Features</h2>
          <div style={s.featGrid}>
            {[
              { icon:"🌍", title:"Multilingual",        desc:"Full support for Urdu (RTL), Hindi, and English with correct text rendering." },
              { icon:"🔏", title:"Digital Stamps",       desc:"Every approved Fatwa gets a unique stamp code and sequential Fatwa Number." },
              { icon:"📄", title:"PDF Export",           desc:"Download any published Fatwa as an official printable PDF document." },
              { icon:"🔐", title:"Secure Access",        desc:"JWT-based authentication with strict role separation for Admin and Mufti." },
              { icon:"📊", title:"Full Audit Trail",     desc:"Every action (assign, approve, reject) is logged with timestamp and IP." },
              { icon:"🔄", title:"Revision Workflow",   desc:"Admin can send answers back to Mufti for revision before final approval." },
            ].map((f) => (
              <div key={f.title} style={s.featCard}>
                <div style={s.featIcon}>{f.icon}</div>
                <h3 style={s.featTitle}>{f.title}</h3>
                <p style={s.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA STRIP ═════════════════════════════ */}
      <section style={s.ctaStrip}>
        <div style={s.ctaInner}>
          <div style={s.ctaArabic}>هل لديك سؤال؟</div>
          <h2 style={s.ctaTitle}>Have a Question?</h2>
          <p style={s.ctaSub}>
            Submit your question in any language. A qualified Mufti will respond with a verified ruling.
          </p>
          <div style={s.heroBtns}>
            <Link to="/submit" style={s.btnPrimary}>✍️ Submit Now — It's Free</Link>
            <Link to="/fatwas" style={s.btnOutline}>📖 Read Published Fatwas</Link>
          </div>
        </div>
      </section>

      {/* ════ LOGIN NOTICE (if not logged in) ══════ */}
      {!isAuthenticated && (
        <section style={s.loginNotice}>
          <p style={s.noticeText}>
            👤 Are you a Mufti or Administrator?{" "}
            <Link to="/login" style={s.noticeLink}>Sign in here →</Link>
          </p>
        </section>
      )}

      {/* ════ FOOTER ════════════════════════════════ */}
      <footer style={s.footer}>
        <div style={s.footerArabic}>وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ</div>
        <p style={s.footerText}>
          Darulifta Jamshedpur · All rulings are issued by qualified Muftis ·{" "}
          <Link to="/fatwas" style={s.footerLink}>Browse Fatwas</Link>
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
      `}</style>
    </div>
  );
};

const s = {
  page:         { minHeight:"100vh", background:"#fff", fontFamily:"'Inter', sans-serif" },

  // ── Hero ────────────────────────────────────────────
  hero:         { background:"linear-gradient(155deg,#064e3b 0%,#065f46 55%,#047857 100%)", padding:"90px 20px 80px", textAlign:"center", position:"relative", overflow:"hidden" },
  heroOverlay:  { position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 20% 50%, rgba(16,185,129,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(167,243,208,0.10) 0%, transparent 50%)", pointerEvents:"none" },
  heroContent:  { maxWidth:"800px", margin:"0 auto", position:"relative", zIndex:1 },
  bismillah:    { fontFamily:"'Noto Nastaliq Urdu', serif", fontSize:"30px", color:"#a7f3d0", direction:"rtl", lineHeight:"2", marginBottom:"12px" },
  heroTitle:    { fontSize:"48px", fontWeight:"900", color:"#fff", margin:"0 0 16px", letterSpacing:"-1px", lineHeight:"1.15" },
  heroSub:      { fontSize:"18px", color:"#6ee7b7", lineHeight:"1.8", margin:"0 0 36px", maxWidth:"600px", marginLeft:"auto", marginRight:"auto" },
  heroBtns:     { display:"flex", gap:"14px", justifyContent:"center", flexWrap:"wrap" },
  btnPrimary:   { padding:"14px 32px", background:"#fff", color:"#065f46", borderRadius:"12px", fontWeight:"800", fontSize:"16px", textDecoration:"none", boxShadow:"0 4px 14px rgba(0,0,0,0.2)", transition:"transform 0.15s" },
  btnOutline:   { padding:"14px 32px", background:"rgba(255,255,255,0.12)", color:"#fff", border:"2px solid rgba(255,255,255,0.35)", borderRadius:"12px", fontWeight:"700", fontSize:"16px", textDecoration:"none" },
  btnDash:      { padding:"14px 32px", background:"#10b981", color:"#fff", borderRadius:"12px", fontWeight:"700", fontSize:"16px", textDecoration:"none" },

  // ── Stats Bar ────────────────────────────────────────
  statsBar:     { background:"#065f46", display:"flex", justifyContent:"center", gap:"0", flexWrap:"wrap" },
  statItem:     { display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 48px", borderRight:"1px solid rgba(255,255,255,0.1)", gap:"4px" },
  statIcon:     { fontSize:"22px" },
  statNum:      { fontSize:"28px", fontWeight:"900", color:"#fff", lineHeight:1 },
  statLabel:    { fontSize:"12px", color:"#6ee7b7", fontWeight:"600" },

  // ── Sections ────────────────────────────────────────
  section:      { padding:"72px 20px", background:"#fff" },
  sectionInner: { maxWidth:"1000px", margin:"0 auto" },
  sectionTitle: { fontSize:"32px", fontWeight:"800", color:"#0f172a", textAlign:"center", margin:"0 0 10px" },
  sectionSub:   { fontSize:"16px", color:"#64748b", textAlign:"center", margin:"0 0 52px" },

  // ── Steps Grid ───────────────────────────────────────
  stepsGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:"24px" },
  stepCard:     { background:"#fff", border:"1px solid #f1f5f9", borderRadius:"16px", padding:"28px 24px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", textAlign:"center" },
  stepIconBox:  { width:"56px", height:"56px", borderRadius:"14px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", margin:"0 auto 12px" },
  stepNum:      { fontSize:"11px", fontWeight:"800", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"6px" },
  stepTitle:    { fontSize:"18px", fontWeight:"800", color:"#0f172a", margin:"0 0 8px" },
  stepDesc:     { fontSize:"13px", color:"#64748b", lineHeight:"1.7", margin:0 },

  // ── Features Grid ────────────────────────────────────
  featGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"20px" },
  featCard:     { background:"#fff", borderRadius:"14px", padding:"24px", border:"1px solid #e2e8f0", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" },
  featIcon:     { fontSize:"32px", marginBottom:"12px" },
  featTitle:    { fontSize:"17px", fontWeight:"800", color:"#0f172a", margin:"0 0 6px" },
  featDesc:     { fontSize:"13px", color:"#64748b", lineHeight:"1.7", margin:0 },

  // ── CTA Strip ────────────────────────────────────────
  ctaStrip:     { background:"linear-gradient(135deg,#064e3b,#065f46)", padding:"72px 20px", textAlign:"center" },
  ctaInner:     { maxWidth:"600px", margin:"0 auto" },
  ctaArabic:    { fontFamily:"'Noto Nastaliq Urdu', serif", fontSize:"24px", color:"#a7f3d0", direction:"rtl", lineHeight:"2", marginBottom:"8px" },
  ctaTitle:     { fontSize:"32px", fontWeight:"800", color:"#fff", margin:"0 0 12px" },
  ctaSub:       { fontSize:"16px", color:"#6ee7b7", lineHeight:"1.7", margin:"0 0 32px" },

  // ── Login Notice ─────────────────────────────────────
  loginNotice:  { padding:"20px", textAlign:"center", background:"#f0fdf4", borderTop:"1px solid #bbf7d0" },
  noticeText:   { fontSize:"14px", color:"#065f46", margin:0 },
  noticeLink:   { color:"#059669", fontWeight:"700", textDecoration:"none" },

  // ── Footer ───────────────────────────────────────────
  footer:       { padding:"32px 20px", textAlign:"center", background:"#0f172a", borderTop:"none" },
  footerArabic: { fontFamily:"'Noto Nastaliq Urdu', serif", fontSize:"20px", color:"#6ee7b7", direction:"rtl", lineHeight:"2", marginBottom:"6px" },
  footerText:   { fontSize:"13px", color:"#64748b", margin:0 },
  footerLink:   { color:"#10b981", textDecoration:"none", fontWeight:"600" },
};

export default HomePage;
