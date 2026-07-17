import { Navigate, useLocation } from 'react-router-dom';
import { useSelector }           from 'react-redux';
import {
  selectIsAuthenticated,
  selectBootstrapping,
  selectUserRole,
} from '../features/auth/authSlice';

// ────────────────────────────────────────────────────
// ProtectedRoute
// Props:
//   - allowedRoles: string[]  e.g., ['super_admin'] or ['mufti','super_admin']
//   - children: JSX element
// ────────────────────────────────────────────────────
const ProtectedRoute = ({ allowedRoles, children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const bootstrapping   = useSelector(selectBootstrapping);
  const role            = useSelector(selectUserRole);
  const location        = useLocation();

  // ── Wait for session check on page refresh ──────────
  if (bootstrapping) {
    return (
      <div style={styles.loader}>
        <div style={styles.spinner} />
        <p style={styles.loaderText}>Verifying session...</p>
      </div>
    );
  }

  // ── Not logged in → redirect to /login ──────────────
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }} // Remember where they came from
        replace
      />
    );
  }

  // ── Logged in but wrong role → redirect to /unauthorized
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ── Authorized ───────────────────────────────────────
  return children;
};

// ── Inline styles (replace with Tailwind/CSS if preferred) ──
const styles = {
  loader: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    height:         '100vh',
    gap:            '16px',
    background:     '#f9fafb',
  },
  spinner: {
    width:           '48px',
    height:          '48px',
    border:          '5px solid #e5e7eb',
    borderTop:       '5px solid #10b981',
    borderRadius:    '50%',
    animation:       'spin 0.8s linear infinite',
  },
  loaderText: {
    color:     '#6b7280',
    fontSize:  '14px',
    fontFamily: 'sans-serif',
  },
};

export default ProtectedRoute;
