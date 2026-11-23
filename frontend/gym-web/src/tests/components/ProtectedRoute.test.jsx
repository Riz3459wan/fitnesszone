import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../context/AuthContext";

const Protected = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated)
    return <div data-testid="redirect-login">Redirecting to login</div>;
  if (allowedRoles && !allowedRoles.includes(user?.role))
    return <div data-testid="redirect-403">Access Denied</div>;
  return children;
};

const Dashboard = () => <div data-testid="dashboard">Dashboard</div>;
const AdminPanel = () => <div data-testid="admin">Admin Panel</div>;

const renderRoute = (authState, allowedRoles) =>
  render(
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route
          path="/app"
          element={
            <Protected allowedRoles={allowedRoles}>
              {allowedRoles?.includes("ADMIN") ? <AdminPanel /> : <Dashboard />}
            </Protected>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe("ProtectedRoute behaviour", () => {
  describe("unauthenticated user", () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    });

    it("redirects to login — does not render protected content", () => {
      renderRoute(null, null);
      expect(screen.getByTestId("redirect-login")).toBeTruthy();
      expect(screen.queryByTestId("dashboard")).toBeNull();
    });
  });

  describe("authenticated user with correct role", () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { username: "admin", role: "ADMIN" },
        isAuthenticated: true,
        loading: false,
      });
    });

    it("renders protected content for ADMIN", () => {
      renderRoute(null, ["ADMIN"]);
      expect(screen.getByTestId("admin")).toBeTruthy();
    });
  });

  describe("authenticated user with wrong role", () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { username: "trainer", role: "TRAINER" },
        isAuthenticated: true,
        loading: false,
      });
    });

    it("shows access denied — TRAINER cannot reach ADMIN-only route", () => {
      renderRoute(null, ["ADMIN"]);
      expect(screen.getByTestId("redirect-403")).toBeTruthy();
      expect(screen.queryByTestId("admin")).toBeNull();
    });

    it("renders content when TRAINER role is allowed", () => {
      renderRoute(null, ["ADMIN", "TRAINER"]);
      expect(screen.getByTestId("admin")).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("shows loading indicator while auth state is resolving", () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: true,
      });
      renderRoute(null, null);
      expect(screen.getByText("Loading...")).toBeTruthy();
      expect(screen.queryByTestId("dashboard")).toBeNull();
      expect(screen.queryByTestId("redirect-login")).toBeNull();
    });
  });
});
