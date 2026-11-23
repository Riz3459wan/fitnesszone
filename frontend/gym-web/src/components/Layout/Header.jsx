import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Package,
  UserCog,
  Settings,
  FileText,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { notificationsAPI } from "../../services/api";
import toast from "react-hot-toast";

const Header = () => {
  const { user, gym, logout } = useAuth();
  const { gymName: settingsGymName, notifPrefs } = useSettings();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (notifPrefs?.inAppNotifications === false) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.data.count);
    } catch {}
  }, [notifPrefs?.inAppNotifications]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handler = () => fetchUnreadCount();
    window.addEventListener("notification-read", handler);
    return () => window.removeEventListener("notification-read", handler);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const menuItems = useMemo(
    () => [
      { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/members", icon: Users, label: "Members" },
      { path: "/attendance", icon: CalendarCheck, label: "Attendance" },
      { path: "/payments", icon: CreditCard, label: "Payments" },
      { path: "/plans", icon: Package, label: "Plans" },
      { path: "/users", icon: UserCog, label: "Users", adminOnly: true },
      { path: "/reports", icon: FileText, label: "Reports", adminOnly: true },
      { path: "/settings", icon: Settings, label: "Settings", adminOnly: true },
    ],
    [],
  );

  const filteredMenuItems = useMemo(() => {
    if (!user) return [];
    return user.role === "ADMIN"
      ? menuItems
      : menuItems.filter((item) => !item.adminOnly);
  }, [user, menuItems]);

  const handleLogout = useCallback(async () => {
    const username = user?.username || "User";
    await logout();
    toast.success(`Goodbye, ${username}!`, { duration: 3000, icon: "👋" });
    navigate("/login");
  }, [logout, navigate, user]);

  const showBell = notifPrefs?.inAppNotifications !== false;

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700/60 sticky top-0 z-20 transition-colors duration-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {settingsGymName || gym?.name || ""}
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-1">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {showBell && (
              <button
                onClick={() => navigate("/notifications")}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {user?.username || "Admin"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    Signed in as{" "}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user?.role || "User"}
                    </span>
                  </div>
                  {user?.role === "ADMIN" && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/profile");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Profile
                    </button>
                  )}
                  <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-col space-y-1">
              {filteredMenuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
