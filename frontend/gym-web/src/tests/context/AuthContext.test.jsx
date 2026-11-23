import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import * as apiModule from "../../services/api";

vi.mock("../../services/api", () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    getGymBySubdomain: vi.fn(),
  },
  userAPI: {
    getById: vi.fn(),
  },
}));

vi.mock("../../utils/subdomain", () => ({
  getSubdomain: vi.fn(() => null),
}));

const mockGym = {
  id: 1,
  name: "Iron House",
  subdomain: "ironhouse",
  planName: "Pro",
  subscriptionStatus: "active",
};
const mockLoginData = {
  data: {
    success: true,
    data: { username: "admin", role: "ADMIN", userId: 1, gym: mockGym },
  },
};
const mockProfileData = {
  data: {
    success: true,
    data: {
      id: 1,
      email: "admin@test.com",
      role: "ADMIN",
      email: "a@a.com",
      gymId: 1,
    },
  },
};

const TestConsumer = () => {
  const { user, gym, login, logout, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="username">{user?.username ?? "none"}</span>
      <span data-testid="gym">{gym?.name ?? "none"}</span>
      <button onClick={() => login("admin@test.com", "pass")}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </MemoryRouter>,
  );

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    apiModule.userAPI.getById.mockResolvedValue(mockProfileData);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("initial state", () => {
    it("starts unauthenticated with no user in memory", () => {
      renderWithProvider();
      expect(screen.getByTestId("auth").textContent).toBe("no");
      expect(screen.getByTestId("username").textContent).toBe("none");
    });

    it("does NOT hydrate user from localStorage on mount", () => {
      // Even if someone manually puts a user object in localStorage,
      // it must be ignored — auth state lives only in memory
      localStorage.setItem(
        "user",
        JSON.stringify({ username: "stale", role: "ADMIN" }),
      );
      localStorage.setItem("token", "old-jwt");
      renderWithProvider();
      expect(screen.getByTestId("auth").textContent).toBe("no");
      expect(screen.getByTestId("username").textContent).toBe("none");
    });
  });

  describe("login", () => {
    it("sets user in memory after successful login", async () => {
      apiModule.authAPI.login.mockResolvedValue(mockLoginData);
      renderWithProvider();

      await act(async () => {
        await userEvent.click(screen.getByText("Login"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth").textContent).toBe("yes");
        expect(screen.getByTestId("username").textContent).toBe("admin");
      });
    });

    it("stores non-sensitive gym info in localStorage after login", async () => {
      apiModule.authAPI.login.mockResolvedValue(mockLoginData);
      renderWithProvider();

      await act(async () => {
        await userEvent.click(screen.getByText("Login"));
      });

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem("gym"));
        expect(stored?.name).toBe("Iron House");
      });
    });

    it("does NOT store JWT, user object, or any auth token in localStorage", async () => {
      apiModule.authAPI.login.mockResolvedValue(mockLoginData);
      renderWithProvider();

      await act(async () => {
        await userEvent.click(screen.getByText("Login"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("auth").textContent).toBe("yes"),
      );

      // None of these should exist — auth state is memory-only
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
      expect(localStorage.getItem("jwt")).toBeNull();
    });

    it("displays gym name after login", async () => {
      apiModule.authAPI.login.mockResolvedValue(mockLoginData);
      renderWithProvider();

      await act(async () => {
        await userEvent.click(screen.getByText("Login"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("gym").textContent).toBe("Iron House"),
      );
    });
  });

  describe("logout", () => {
    const loginFirst = async () => {
      apiModule.authAPI.login.mockResolvedValue(mockLoginData);
      await act(async () => {
        await userEvent.click(screen.getByText("Login"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("auth").textContent).toBe("yes"),
      );
    };

    it("clears user from memory on logout", async () => {
      apiModule.authAPI.logout.mockResolvedValue({ data: { success: true } });
      renderWithProvider();
      await loginFirst();

      await act(async () => {
        await userEvent.click(screen.getByText("Logout"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth").textContent).toBe("no");
        expect(screen.getByTestId("username").textContent).toBe("none");
      });
    });

    it("removes gym from localStorage on logout", async () => {
      apiModule.authAPI.logout.mockResolvedValue({ data: { success: true } });
      renderWithProvider();
      await loginFirst();

      await act(async () => {
        await userEvent.click(screen.getByText("Logout"));
      });

      await waitFor(() => expect(localStorage.getItem("gym")).toBeNull());
    });

    it("clears state even when logout API call fails", async () => {
      apiModule.authAPI.logout.mockRejectedValue(new Error("network error"));
      renderWithProvider();
      await loginFirst();

      await act(async () => {
        await userEvent.click(screen.getByText("Logout"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("auth").textContent).toBe("no"),
      );
    });
  });

  describe("session expiry", () => {
    it("clears user when auth:session-expired CustomEvent is dispatched", async () => {
      apiModule.authAPI.login.mockResolvedValue(mockLoginData);
      renderWithProvider();

      await act(async () => {
        await userEvent.click(screen.getByText("Login"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("auth").textContent).toBe("yes"),
      );

      await act(async () => {
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("auth").textContent).toBe("no"),
      );
    });
  });
});
