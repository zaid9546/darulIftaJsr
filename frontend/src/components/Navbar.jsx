import { Link, useNavigate }   from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectUser,
  selectIsAuthenticated,
  logoutUser,
} from '../features/auth/authSlice';

const Navbar = () => {
  const dispatch        = useDispatch();
  const navigate        = useNavigate();
  const user            = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  return (
    <nav style={styles.nav}>
      {/* ── Brand ─────────────────────────────────── */}
      <Link to="/" style={styles.brand}>
        🕌 Darulifta Jamshedpur
      </Link>

      {/* ── Nav Links ─────────────────────────────── */}
      <div style={styles.links}>
        <Link to="/fatwas" style={styles.link}>
          📖 Public Fatwas
        </Link>
        <Link to="/submit" style={styles.link}>
          ✉️ Ask a Question
        </Link>

        {/* Super Admin Links */}
        {isAuthenticated && user?.role === 'super_admin' && (
          <Link to="/admin" style={styles.link}>
            🛠️ Admin Dashboard
          </Link>
        )}

        {/* Mufti Links */}
        {isAuthenticated && user?.role === 'mufti' && (
          <Link to="/mufti" style={styles.link}>
            📋 My Questions
          </Link>
        )}
      </div>

      {/* ── Auth Section ──────────────────────────── */}
      <div style={styles.authSection}>
        {isAuthenticated ? (
          <>
            <span style={styles.userName}>
              👤 {user?.name}
              <span style={styles.roleBadge}>
                {user?.role === 'super_admin' ? '⚡ Admin' : '📚 Mufti'}
              </span>
            </span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              🚪 Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={styles.loginBtn}>
            🔑 Login
          </Link>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         '0 24px',
    height:          '64px',
    background:      '#1e293b',
    boxShadow:       '0 2px 8px rgba(0,0,0,0.3)',
    position:        'sticky',
    top:             0,
    zIndex:          100,
  },
  brand: {
    color:          '#10b981',
    fontSize:       '22px',
    fontWeight:     '700',
    textDecoration: 'none',
    letterSpacing:  '0.5px',
  },
  links: {
    display: 'flex',
    gap:     '20px',
  },
  link: {
    color:          '#cbd5e1',
    textDecoration: 'none',
    fontSize:       '14px',
    fontWeight:     '500',
    transition:     'color 0.2s',
  },
  authSection: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  userName: {
    color:      '#94a3b8',
    fontSize:   '13px',
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
  },
  roleBadge: {
    background:   '#10b981',
    color:        '#fff',
    fontSize:     '11px',
    padding:      '2px 8px',
    borderRadius: '999px',
    fontWeight:   '600',
  },
  logoutBtn: {
    background:   'transparent',
    border:       '1px solid #ef4444',
    color:        '#ef4444',
    padding:      '6px 14px',
    borderRadius: '6px',
    cursor:       'pointer',
    fontSize:     '13px',
    fontWeight:   '600',
    transition:   'all 0.2s',
  },
  loginBtn: {
    background:     '#10b981',
    color:          '#fff',
    padding:        '7px 18px',
    borderRadius:   '6px',
    textDecoration: 'none',
    fontSize:       '13px',
    fontWeight:     '600',
  },
};

export default Navbar;
