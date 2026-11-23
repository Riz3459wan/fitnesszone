import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { settingsAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const formatCurrency = (amount, currency = "INR") => {
  const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || "₹";
  return `${symbol}${Number(amount || 0).toLocaleString("en-IN")}`;
};

export const formatDate = (date, format = "DD/MM/YYYY") => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  switch (format) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

export const formatTime = (time, format = "24h") => {
  if (!time) return "";
  if (format === "12h") {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${minutes} ${ampm}`;
  }
  return time;
};

const COLOR_PALETTES = {
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },
  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
  },
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  pink: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
    900: "#831843",
  },
};

const FONT_MAP = {
  inter: "'Inter', sans-serif",
  poppins: "'Poppins', sans-serif",
  roboto: "'Roboto', sans-serif",
  nunito: "'Nunito', sans-serif",
};

const GOOGLE_FONTS_URL = {
  inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  poppins:
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  roboto:
    "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  nunito:
    "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap",
};

function loadGoogleFont(font) {
  const id = `gfont-${font}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_URL[font] || "";
  document.head.appendChild(link);
}

function applyThemeForAuth(appearance = {}) {
  const theme = appearance.theme || "light";
  const color = appearance.primaryColor || "blue";
  const font = appearance.fontFamily || "inter";

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);

  const palette = COLOR_PALETTES[color] || COLOR_PALETTES.blue;
  const root = document.documentElement;
  Object.entries(palette).forEach(([stop, val]) => {
    root.style.setProperty(`--p-${stop}`, val);
  });

  loadGoogleFont(font);
  const fontValue = FONT_MAP[font] || FONT_MAP.inter;
  root.style.setProperty("--font-body", fontValue);
}

function resetThemeForPublic() {
  document.documentElement.classList.remove("dark");
  const root = document.documentElement;
  const defaultPalette = COLOR_PALETTES.blue;
  Object.entries(defaultPalette).forEach(([stop, val]) => {
    root.style.setProperty(`--p-${stop}`, val);
  });
  root.style.setProperty("--font-body", FONT_MAP.inter);
}

const DEFAULT_SETTINGS = {
  general: {
    gymName: "",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    timezone: "Asia/Kolkata",
  },
  notifications: {
    inAppNotifications: true,
    newMemberAlerts: true,
    paymentAlerts: true,
    attendanceAlerts: false,
    emailNotifications: false,
    dailyReport: false,
    weeklyReport: false,
    monthlyReport: false,
    soundEnabled: false,
    quietHours: false,
    quietFrom: "22:00",
    quietUntil: "07:00",
    expiryAlerts: true,
    expiryDaysBefore: "7",
  },
  appearance: {
    theme: "light",
    primaryColor: "blue",
    fontFamily: "inter",
    sidebarCollapsed: false,
    compactView: false,
    animations: true,
    showAvatars: true,
    tableDensity: "standard",
  },
};

export const SettingsProvider = ({ children }) => {
  const { user, gym, isAuthenticated } = useAuth();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!isAuthenticated) {
      resetThemeForPublic();
      setSettings(DEFAULT_SETTINGS);
      setSettingsLoaded(true);
      return;
    }

    try {
      const response = await settingsAPI.get();
      const data = response.data.data;
      const merged = {
        general: { ...DEFAULT_SETTINGS.general, ...(data.general || {}) },
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...(data.notifications || {}),
        },
        appearance: {
          ...DEFAULT_SETTINGS.appearance,
          ...(data.appearance || {}),
        },
      };
      setSettings(merged);
      applyThemeForAuth(merged.appearance);
    } catch {
      applyThemeForAuth(DEFAULT_SETTINGS.appearance);
    } finally {
      setSettingsLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (user || gym) loadSettings();
    if (!isAuthenticated) {
      resetThemeForPublic();
    }
  }, [user, gym, isAuthenticated, loadSettings]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (settings.appearance?.theme === "system") {
        document.documentElement.classList.toggle("dark", mq.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.appearance?.theme, isAuthenticated]);

  const updateSettings = useCallback((newSettings) => {
    const merged = {
      general: { ...DEFAULT_SETTINGS.general, ...(newSettings.general || {}) },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(newSettings.notifications || {}),
      },
      appearance: {
        ...DEFAULT_SETTINGS.appearance,
        ...(newSettings.appearance || {}),
      },
    };
    setSettings(merged);
    applyThemeForAuth(merged.appearance);
  }, []);

  const currency = settings.general?.currency || "INR";
  const dateFormat = settings.general?.dateFormat || "DD/MM/YYYY";
  const timeFormat = settings.general?.timeFormat || "24h";
  const gymName = settings.general?.gymName || "";
  const theme = settings.appearance?.theme || "light";
  const notifPrefs = settings.notifications || {};
  const appearance = settings.appearance || {};

  return (
    <SettingsContext.Provider
      value={{
        settings,
        settingsLoaded,
        updateSettings,
        reloadSettings: loadSettings,
        currency,
        dateFormat,
        timeFormat,
        gymName,
        theme,
        notifPrefs,
        appearance,
        formatCurrency: (amount) => formatCurrency(amount, currency),
        formatDate: (date) => formatDate(date, dateFormat),
        formatTime: (time) => formatTime(time, timeFormat),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
