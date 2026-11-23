import React, { useState, useEffect, useCallback, useMemo } from "react";
import { notificationsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import {
  Bell,
  Check,
  X,
  Clock,
  IndianRupee,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import toast from "react-hot-toast";
import Loader from "../components/Common/Loader";
import EmptyState from "../components/Common/EmptyState";
import Pagination from "../components/Common/Pagination";

const NOTIF_SOUND_URL =
  "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const Notifications = () => {
  const { user } = useAuth();
  const { notifPrefs, formatDate } = useSettings();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isAdmin = user?.role === "ADMIN";

  const playSound = useCallback(() => {
    if (!notifPrefs?.soundEnabled) return;
    try {
      const audio = new Audio(NOTIF_SOUND_URL);
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch {}
  }, [notifPrefs?.soundEnabled]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationsAPI.getAll();
      const data = response.data.data || [];
      const prev = notifications.length;
      setNotifications(data);
      if (
        prev > 0 &&
        data.filter((n) => !n.read).length >
          notifications.filter((n) => !n.read).length
      ) {
        playSound();
      }
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [notifications, playSound]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = useCallback(
    async (id) => {
      if (!isAdmin) return;
      try {
        await notificationsAPI.markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        window.dispatchEvent(new CustomEvent("notification-read"));
      } catch {
        toast.error("Failed to mark as read");
      }
    },
    [isAdmin],
  );

  const markAllAsRead = useCallback(async () => {
    if (!isAdmin) return;
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
      window.dispatchEvent(new CustomEvent("notification-read"));
    } catch {
      toast.error("Failed to mark all as read");
    }
  }, [isAdmin]);

  const deleteNotification = useCallback(
    async (id) => {
      if (!isAdmin) return;
      try {
        await notificationsAPI.delete(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        window.dispatchEvent(new CustomEvent("notification-read"));
      } catch {
        toast.error("Failed to delete notification");
      }
    },
    [isAdmin],
  );

  const getIcon = (type) => {
    switch (type) {
      case "payment":
        return IndianRupee;
      case "attendance":
        return Clock;
      case "member":
        return UserPlus;
      default:
        return Bell;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case "payment":
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          text: "text-green-600 dark:text-green-400",
          border: "border-green-200 dark:border-green-800/50",
        };
      case "attendance":
        return {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-600 dark:text-blue-400",
          border: "border-blue-200 dark:border-blue-800/50",
        };
      case "member":
        return {
          bg: "bg-purple-100 dark:bg-purple-900/30",
          text: "text-purple-600 dark:text-purple-400",
          border: "border-purple-200 dark:border-purple-800/50",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-800",
          text: "text-gray-600 dark:text-gray-400",
          border: "border-gray-200 dark:border-gray-700",
        };
    }
  };

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    if (filter === "unread") filtered = notifications.filter((n) => !n.read);
    if (filter === "read") filtered = notifications.filter((n) => n.read);
    return filtered;
  }, [notifications, filter]);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(start, start + itemsPerPage);
  }, [filteredNotifications, currentPage]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  if (loading) return <Loader />;

  if (notifPrefs?.inAppNotifications === false) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-16">
          <VolumeX className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            In-app notifications are turned off
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            You can enable them in Settings → Notifications.
          </p>
        </div>
      </div>
    );
  }

  const FILTERS = [
    { key: "all", label: `All (${notifications.length})` },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "read", label: `Read (${notifications.length - unreadCount})` },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated with gym activities</p>
        </div>
        <div className="flex items-center gap-2">
          {notifPrefs?.soundEnabled && (
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Volume2 className="h-3.5 w-3.5" /> Sound on
            </span>
          )}
          {isAdmin && unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-secondary text-sm">
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4 overflow-x-auto">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === key
                  ? "bg-primary-600 text-white dark:bg-primary-500"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {paginatedNotifications.length > 0 ? (
            paginatedNotifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const { bg, text, border } = getColors(notification.type);
              const isUnread = !notification.read;

              return (
                <div
                  key={notification.id}
                  className={`rounded-xl border transition-all duration-200 ${
                    isUnread
                      ? `bg-gradient-to-r ${border} shadow-sm`
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  } ${
                    isUnread
                      ? "border-l-4 border-l-primary-500 dark:border-l-primary-400"
                      : ""
                  }`}
                  style={{
                    ...(isUnread && {
                      backgroundImage:
                        "linear-gradient(to right, rgba(59,130,246,0.02), transparent)",
                    }),
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2.5 rounded-full ${bg} flex-shrink-0 mt-0.5`}
                      >
                        <Icon className={`h-5 w-5 ${text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`font-semibold text-base ${
                                  isUnread
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {notification.title}
                              </h4>
                              {isUnread && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">
                                  New
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-sm mt-1.5 leading-relaxed ${
                                isUnread
                                  ? "text-gray-700 dark:text-gray-300"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {notification.time ||
                                  formatDate(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 flex-shrink-0">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                  aria-label="Mark as read"
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                                className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                aria-label="Delete"
                                title="Delete"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No notifications"
              message="You're all caught up!"
              icon={Bell}
            />
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
