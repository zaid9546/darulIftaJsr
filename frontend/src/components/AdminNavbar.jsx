import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, selectUser } from "../features/auth/authSlice";

const NAV_LINKS = [
  { path: "/admin",        icon: "🛠️", label: "Dashboard"        },
  { path: "/admin/muftis", icon: "🧕", label: "Mufti Management" },
  { path: "/fatwas",       icon: "📖", label: "Published Fatwas" },
  { path: "/submit",       icon: "✍️", label: "Submit Question"  },
];

const AdminNavbar = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useSelector(selectUser);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav style={s.navbar}>
        <div style={s.navInner}>

          {/* ── LEFT: Clickable User Chip → Profile ─────────── */}
          <Link
            to="/profile"
            style={{
              ...s.userChip,
              textDecoration: "none",
              cursor:         "pointer",
              flexShrink:     0,
            }}
            title="View your profile"
          >
            <div style={s.userAvatar}>
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div style={s.userInfo}>
              <span style={s.userName}>
                {user?.name || "Admin"}
              </span>
              <span style={{ ...s.userRoleBadge, color: "#a7f3d0" }}>
                {user?.profileIdCustom || user?.profileId || "Super Admin"}
              </span>
            </div>
          </Link>

          {/* ── CENTER: Desktop Nav Links ────────────────────── */}
          <div style={s.desktopLinks}>
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    ...s.navLink,
                    ...(isActive ? s.navLinkActive : {}),
                  }}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                  {isActive && <span style={s.activeDot} />}
                </Link>
              );
            })}
          </div>

          {/* ── RIGHT: Logout + Hamburger (NO duplicate chip) ── */}
          <div style={s.rightSection}>

            {/* ✅ Logout button */}
            <button
              style={{
                ...s.logoutBtn,
                opacity: loggingOut ? 0.6 : 1,
              }}
              onClick={handleLogout}
              disabled={loggingOut}
              title="Logout"
            >
              {loggingOut ? "⏳" : "🚪"} Logout
            </button>

            {/* ✅ Mobile Hamburger */}
            <button
              style={s.hamburger}
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Toggle menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>

        </div>

        {/* ── Mobile Dropdown Menu ─────────────────────────── */}
        {menuOpen && (
          <div style={s.mobileMenu}>
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    ...s.mobileLink,
                    ...(isActive ? s.mobileLinkActive : {}),
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Profile link in mobile menu */}
            <Link
              to="/profile"
              style={s.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              <span>👤</span>
              <span>{user?.name || "My Profile"}</span>
            </Link>

            <div style={s.mobileDivider} />

            <button
              style={s.mobileLogout}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              🚪 {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}
      </nav>

      {/* ── Spacer so content doesn't hide under navbar ─── */}
      <div style={{ height: "68px" }} />

      <style>{`
        @media (max-width: 768px) {
          .admin-desktop-links { display: none  !important; }
          .admin-hamburger      { display: flex  !important; }
        }
      `}</style>
    </>
  );
};

// ════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════
const s = {
  navbar: {
    position:     "fixed",
    top:          0,
    left:         0,
    right:        0,
    zIndex:       1000,
    background:   "#065f46",
    boxShadow:    "0 2px 16px rgba(0,0,0,0.18)",
    borderBottom: "3px solid #10b981",
  },
  navInner: {
    maxWidth:       "1200px",
    margin:         "0 auto",
    padding:        "0 24px",
    height:         "68px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    gap:            "20px",
  },

  // ── User Chip (LEFT — clickable Link) ────────────────
  userChip: {
    display:      "flex",
    alignItems:   "center",
    gap:          "10px",
    background:   "rgba(255,255,255,0.10)",
    border:       "1px solid rgba(255,255,255,0.20)",
    borderRadius: "10px",
    padding:      "6px 14px 6px 8px",
  },
  userAvatar: {
    width:          "34px",
    height:         "34px",
    borderRadius:   "50%",
    background:     "#10b981",
    color:          "#fff",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontWeight:     "800",
    fontSize:       "16px",
    flexShrink:     0,
  },
  userInfo: {
    display:       "flex",
    flexDirection: "column",
    gap:           "1px",
  },
  userName: {
    fontSize:   "13px",
    fontWeight: "700",
    color:      "#fff",
    lineHeight: 1.2,
  },
  userRoleBadge: {
    fontSize:   "10px",
    color:      "#6ee7b7",
    fontWeight: "600",
    lineHeight: 1,
  },

  // ── Desktop Nav Links ────────────────────────────────
  desktopLinks: {
    display:        "flex",
    gap:            "4px",
    alignItems:     "center",
    flex:           1,
    justifyContent: "center",
  },
  navLink: {
    display:        "flex",
    alignItems:     "center",
    gap:            "7px",
    padding:        "8px 16px",
    borderRadius:   "10px",
    color:          "#a7f3d0",
    textDecoration: "none",
    fontSize:       "14px",
    fontWeight:     "600",
    position:       "relative",
    transition:     "background 0.15s, color 0.15s",
    whiteSpace:     "nowrap",
  },
  navLinkActive: {
    background: "rgba(255,255,255,0.15)",
    color:      "#fff",
    fontWeight: "800",
  },
  activeDot: {
    position:     "absolute",
    bottom:       "4px",
    left:         "50%",
    transform:    "translateX(-50%)",
    width:        "4px",
    height:       "4px",
    borderRadius: "50%",
    background:   "#10b981",
  },

  // ── Right Section ────────────────────────────────────
  rightSection: {
    display:    "flex",
    alignItems: "center",
    gap:        "12px",
    flexShrink: 0,
  },
  logoutBtn: {
    display:      "flex",
    alignItems:   "center",
    gap:          "6px",
    background:   "rgba(239,68,68,0.15)",
    border:       "1px solid rgba(239,68,68,0.35)",
    color:        "#fca5a5",
    padding:      "8px 16px",
    borderRadius: "8px",
    cursor:       "pointer",
    fontSize:     "13px",
    fontWeight:   "700",
    transition:   "background 0.15s",
    whiteSpace:   "nowrap",
  },
  hamburger: {
    display:        "none",
    background:     "rgba(255,255,255,0.10)",
    border:         "1px solid rgba(255,255,255,0.20)",
    color:          "#fff",
    width:          "40px",
    height:         "40px",
    borderRadius:   "8px",
    cursor:         "pointer",
    fontSize:       "18px",
    alignItems:     "center",
    justifyContent: "center",
  },

  // ── Mobile Menu ──────────────────────────────────────
  mobileMenu: {
    background:    "#064e3b",
    borderTop:     "1px solid rgba(255,255,255,0.10)",
    padding:       "12px 16px 16px",
    display:       "flex",
    flexDirection: "column",
    gap:           "4px",
  },
  mobileLink: {
    display:        "flex",
    alignItems:     "center",
    gap:            "10px",
    padding:        "12px 16px",
    borderRadius:   "10px",
    color:          "#a7f3d0",
    textDecoration: "none",
    fontSize:       "15px",
    fontWeight:     "600",
  },
  mobileLinkActive: {
    background: "rgba(255,255,255,0.12)",
    color:      "#fff",
  },
  mobileDivider: {
    height:     "1px",
    background: "rgba(255,255,255,0.10)",
    margin:     "8px 0",
  },
  mobileLogout: {
    background:   "rgba(239,68,68,0.15)",
    border:       "1px solid rgba(239,68,68,0.35)",
    color:        "#fca5a5",
    padding:      "12px 16px",
    borderRadius: "10px",
    cursor:       "pointer",
    fontSize:     "15px",
    fontWeight:   "700",
    textAlign:    "left",
  },
};

export default AdminNavbar;
