import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import Layout from "./components/Layout/Layout";
import SubscriptionGuard from "./pages/SubscriptionGuard";
import { getSubdomain } from "./utils/subdomain";
import NotFound from "./pages/NotFound";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SubscriptionPlans = lazy(() => import("./pages/SubscriptionPlans"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const MemberForm = lazy(() => import("./pages/MemberForm"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Payments = lazy(() => import("./pages/Payments"));
const Plans = lazy(() => import("./pages/Plans"));
const PlanForm = lazy(() => import("./pages/PlanForm"));
const Users = lazy(() => import("./pages/Users"));
const UserForm = lazy(() => import("./pages/UserForm"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Reports = lazy(() => import("./pages/Reports"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Announcements = lazy(() => import("./pages/Announcements"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

const isMainDomain = () => {
  const hostname = window.location.hostname.toLowerCase().split(":")[0];
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "gymzora.com" ||
    hostname === "www.gymzora.com"
  );
};

const TenantRedirect = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const subdomain = getSubdomain();

  if (loading) return <LoadingFallback />;

  if (!isAuthenticated && !subdomain && !isMainDomain()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const subdomain = getSubdomain();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) {
    if (subdomain)
      return (
        <Navigate to={`/login?gym=${encodeURIComponent(subdomain)}`} replace />
      );
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/subscription" element={<SubscriptionPlans />} />

        <Route
          element={
            <ProtectedRoute>
              <SubscriptionGuard>
                <Layout />
              </SubscriptionGuard>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/new" element={<MemberForm />} />
          <Route path="/members/edit/:id" element={<MemberForm />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/plans/new" element={<PlanForm />} />
          <Route path="/plans/edit/:id" element={<PlanForm />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/announcements" element={<Announcements />} />

          <Route
            path="/users"
            element={
              <RoleRoute roles={["ADMIN"]}>
                <Users />
              </RoleRoute>
            }
          />
          <Route
            path="/users/new"
            element={
              <RoleRoute roles={["ADMIN"]}>
                <UserForm />
              </RoleRoute>
            }
          />
          <Route
            path="/users/edit/:id"
            element={
              <RoleRoute roles={["ADMIN"]}>
                <UserForm />
              </RoleRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleRoute roles={["ADMIN"]}>
                <Settings />
              </RoleRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <RoleRoute roles={["ADMIN"]}>
                <Profile />
              </RoleRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleRoute roles={["ADMIN"]}>
                <Reports />
              </RoleRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SettingsProvider>
          <TenantRedirect>
            <AppRoutes />
          </TenantRedirect>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
