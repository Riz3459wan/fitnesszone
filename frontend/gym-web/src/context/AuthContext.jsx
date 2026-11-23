import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, userAPI } from "../services/api";
import { getSubdomain } from "../utils/subdomain";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const GYM_KEY = "gym";
const LAST_SUBDOMAIN_KEY = "lastGymSubdomain";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [gym, setGym] = useState(() => {
    try {
      const stored = localStorage.getItem(GYM_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persistGym = useCallback((gymData) => {
    if (gymData) {
      localStorage.setItem(GYM_KEY, JSON.stringify(gymData));
      if (gymData.subdomain) {
        localStorage.setItem(LAST_SUBDOMAIN_KEY, gymData.subdomain);
      }
    }
    setGym(gymData);
  }, []);

  const clearGym = useCallback(() => {
    localStorage.removeItem(GYM_KEY);
    localStorage.removeItem(LAST_SUBDOMAIN_KEY);
    setGym(null);
  }, []);

  const fetchGymBySubdomain = useCallback(
    async (subdomain) => {
      try {
        const response = await authAPI.getGymBySubdomain(subdomain);
        if (response.data.success) persistGym(response.data.data);
      } catch {}
    },
    [persistGym],
  );

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await authAPI.me();
        if (response.data.success) {
          const data = response.data.data;
          const gymData =
            data.gym && Object.keys(data.gym).length > 0 ? data.gym : null;
          setUser({
            username: data.username,
            role: data.role,
            userId: data.userId,
            gymId: gymData ? gymData.id : null,
          });
          if (gymData) persistGym(gymData);
        }
      } catch {
        const subdomain = getSubdomain();
        if (!gym && subdomain) await fetchGymBySubdomain(subdomain);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    const handler = () => {
      setUser(null);
      clearGym();
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, [navigate, clearGym]);

  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const response = await userAPI.getById(userId);
      if (response.data.success) {
        const u = response.data.data;
        const userData = {
          userId: u.id,
          username: u.username,
          role: u.role,
          fullName: u.fullName || "",
          email: u.email,
          phone: u.phone || "",
          gymId: u.gymId,
        };
        setUser(userData);
        return userData;
      }
    } catch {}
    return null;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const subdomain = getSubdomain();
      const response = await authAPI.login(email, password, subdomain);

      if (response.data.success) {
        const data = response.data.data;
        const gymData = data.gym;

        setUser({
          username: data.username,
          role: data.role,
          userId: data.userId,
          gymId: gymData ? gymData.id : null,
        });
        if (gymData) persistGym(gymData);

        fetchUserProfile(data.userId);

        return { success: true, gym: gymData };
      }
      return { success: false };
    },
    [persistGym, fetchUserProfile],
  );

  const register = useCallback(
    async (userData) => {
      const response = await authAPI.register(userData);
      if (response.data.success) {
        const { gym: gymData, subdomain } = response.data.data;
        if (gymData) persistGym(gymData);
        return { success: true, subdomain, gym: gymData };
      }
      return { success: false, message: response.data.message };
    },
    [persistGym],
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {}
    setUser(null);
    clearGym();

    localStorage.removeItem("theme");
    localStorage.removeItem("primaryColor");
    localStorage.removeItem("fontFamily");

    document.documentElement.classList.remove("dark");
    const root = document.documentElement;
    root.style.setProperty("--p-50", "#eff6ff");
    root.style.setProperty("--p-100", "#dbeafe");
    root.style.setProperty("--p-200", "#bfdbfe");
    root.style.setProperty("--p-300", "#93c5fd");
    root.style.setProperty("--p-400", "#60a5fa");
    root.style.setProperty("--p-500", "#3b82f6");
    root.style.setProperty("--p-600", "#2563eb");
    root.style.setProperty("--p-700", "#1d4ed8");
    root.style.setProperty("--p-800", "#1e40af");
    root.style.setProperty("--p-900", "#1e3a8a");
    root.style.setProperty("--font-body", "'Inter', sans-serif");
  }, [clearGym]);

  const updateUserInContext = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        gym,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
        updateUserInContext,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
