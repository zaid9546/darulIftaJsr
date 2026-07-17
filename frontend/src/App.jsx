import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";

// ── Auth
import { fetchMe } from "./features/auth/authSlice";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";

// ── Pages (lazy-loaded in Step 6+)
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MuftiManagement from "./pages/admin/MuftiManagement";
import SubmitQuestion from "./pages/SubmitQuestion";
import PublicFeed from "./pages/PublicFeed";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import MuftiDashboard from "./pages/MuftiDashboard";
import FatwaDetail from "./pages/FatwaDetail";
import ProfilePage from "./pages/ProfilePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const UnauthorizedPage = () => (
  <div style={{ ...pg, color: "#ef4444" }}>
    🚫 403 — You are not authorized to view this page.
  </div>
);
const NotFoundPage = () => (
  <div style={{ ...pg, color: "#6b7280" }}>🔍 404 — Page not found.</div>
);
const pg = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "80vh",
  fontSize: "22px",
  fontFamily: "sans-serif",
};

// ── Create a layout wrapper ────────────────────────────
const AdminLayout = ({ children }) => (
  <>
    <AdminNavbar />
    {children}
  </>
);

// ════════════════════════════════════════════════════
const App = () => {
  const dispatch = useDispatch();

  // ── Bootstrap: check if user has a valid session ───
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  

  return (
    <>
      <Navbar />

      <Routes>
        {/* ── Public Routes ─────────────────────────── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/submit" element={<SubmitQuestion />} />
        <Route path="/fatwas" element={<PublicFeed />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ── Super Admin Routes ────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <AdminLayout>
                <SuperAdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/muftis"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <AdminLayout>
                <MuftiManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/muftis/register"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <AdminLayout>
                <RegisterPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Mufti Routes ──────────────────────────── */}
        <Route
          path="/mufti"
          element={
            <ProtectedRoute allowedRoles={["mufti", "super_admin"]}>
              <MuftiDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["super_admin", "mufti", "free"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ── Utility Routes ────────────────────────── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/fatwas/:id" element={<FatwaDetail />} />
      </Routes>
    </>
  );
};

export default App;
