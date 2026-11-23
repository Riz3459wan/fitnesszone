import React, { useState, useEffect, useCallback, useMemo } from "react";
import { settingsAPI } from "../services/api";
import { useSettings } from "../context/SettingsContext";
import {
  Save,
  RotateCcw,
  Bell,
  Palette,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import toast from "react-hot-toast";

const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
  </label>
);

const ToggleRow = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
    <div>
      <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

const SectionLabel = ({ children }) => (
  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 mt-6 first:mt-0">
    {children}
  </h3>
);

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const { updateSettings } = useSettings();

  const [settings, setSettings] = useState({
    general: {},
    notifications: {},
    appearance: {},
  });

  const fetchSettings = useCallback(async () => {
    setFetching(true);
    try {
      const response = await settingsAPI.get();
      const data = response.data.data;
      setSettings({
        general: data.general || {},
        notifications: data.notifications || {},
        appearance: data.appearance || {},
      });
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = useCallback((category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.save({
        settings: settings.general,
        notifications: settings.notifications,
        appearance: settings.appearance,
      });
      const saved = response.data.data;
      const newSettings = {
        general: saved.general || {},
        notifications: saved.notifications || {},
        appearance: saved.appearance || {},
      };
      setSettings(newSettings);
      updateSettings(newSettings);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  }, [settings, updateSettings]);

  const handleReset = useCallback(async () => {
    if (!window.confirm("Reset all settings to defaults?")) return;
    try {
      await settingsAPI.reset();
      await fetchSettings();
      toast.success("Settings reset");
    } catch {
      toast.error("Failed to reset settings");
    }
  }, [fetchSettings]);

  const tabs = useMemo(
    () => [
      { id: "general", label: "General", icon: SettingsIcon },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "appearance", label: "Appearance", icon: Palette },
    ],
    [],
  );

  const renderGeneral = useCallback(
    () => (
      <div className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Gym Name
            </label>
            <input
              type="text"
              value={settings.general.gymName || ""}
              onChange={(e) =>
                handleChange("general", "gymName", e.target.value)
              }
              className="input-field"
              placeholder="Enter gym name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Subdomain
            </label>
            <input
              type="text"
              value={settings.general.subdomain || ""}
              disabled
              className="input-field opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Admin Name
            </label>
            <input
              type="text"
              value={settings.general.adminName || ""}
              onChange={(e) =>
                handleChange("general", "adminName", e.target.value)
              }
              className="input-field"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={settings.general.email || ""}
              onChange={(e) => handleChange("general", "email", e.target.value)}
              className="input-field"
              placeholder="admin@gym.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={settings.general.phone || ""}
              onChange={(e) => handleChange("general", "phone", e.target.value)}
              className="input-field"
              placeholder="+91 12345 67890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Plan
            </label>
            <input
              type="text"
              value={settings.general.planName || ""}
              disabled
              className="input-field opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Contact support to change
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Time Zone
            </label>
            <select
              value={settings.general.timezone || "Asia/Kolkata"}
              onChange={(e) =>
                handleChange("general", "timezone", e.target.value)
              }
              className="input-field"
            >
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Mumbai">Mumbai</option>
              <option value="Asia/Chennai">Chennai</option>
              <option value="Asia/Bangalore">Bangalore</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Currency
            </label>
            <select
              value={settings.general.currency || "INR"}
              onChange={(e) =>
                handleChange("general", "currency", e.target.value)
              }
              className="input-field"
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Date Format
            </label>
            <select
              value={settings.general.dateFormat || "DD/MM/YYYY"}
              onChange={(e) =>
                handleChange("general", "dateFormat", e.target.value)
              }
              className="input-field"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Time Format
            </label>
            <select
              value={settings.general.timeFormat || "24h"}
              onChange={(e) =>
                handleChange("general", "timeFormat", e.target.value)
              }
              className="input-field"
            >
              <option value="24h">24-hour (14:30)</option>
              <option value="12h">12-hour (2:30 PM)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Address
          </label>
          <textarea
            value={settings.general.address || ""}
            onChange={(e) => handleChange("general", "address", e.target.value)}
            rows="3"
            className="input-field resize-none"
            placeholder="Gym address"
          />
        </div>
      </div>
    ),
    [settings.general, handleChange],
  );

  const renderNotifications = useCallback(
    () => (
      <div className="space-y-3">
        <SectionLabel>Activity Alerts</SectionLabel>
        <ToggleRow
          label="New Member Joined"
          desc="Notify when a new member registers"
          checked={settings.notifications.newMemberAlerts || false}
          onChange={(e) =>
            handleChange("notifications", "newMemberAlerts", e.target.checked)
          }
        />
        <ToggleRow
          label="Payment Received"
          desc="Alert on successful or pending payments"
          checked={settings.notifications.paymentAlerts || false}
          onChange={(e) =>
            handleChange("notifications", "paymentAlerts", e.target.checked)
          }
        />
        <ToggleRow
          label="Attendance Check-in"
          desc="Notify when a member checks in"
          checked={settings.notifications.attendanceAlerts || false}
          onChange={(e) =>
            handleChange("notifications", "attendanceAlerts", e.target.checked)
          }
        />

        <SectionLabel>Scheduled Reports</SectionLabel>
        <ToggleRow
          label="Daily Summary"
          desc="Receive a daily digest every morning"
          checked={settings.notifications.dailyReport || false}
          onChange={(e) =>
            handleChange("notifications", "dailyReport", e.target.checked)
          }
        />
        <ToggleRow
          label="Weekly Report"
          desc="Weekly breakdown of all activity"
          checked={settings.notifications.weeklyReport || false}
          onChange={(e) =>
            handleChange("notifications", "weeklyReport", e.target.checked)
          }
        />
        <ToggleRow
          label="Monthly Report"
          desc="Full monthly performance overview"
          checked={settings.notifications.monthlyReport || false}
          onChange={(e) =>
            handleChange("notifications", "monthlyReport", e.target.checked)
          }
        />

        <SectionLabel>Delivery</SectionLabel>
        <ToggleRow
          label="In-App Notifications"
          desc="Show the bell icon and notification feed in the header"
          checked={settings.notifications.inAppNotifications !== false}
          onChange={(e) =>
            handleChange(
              "notifications",
              "inAppNotifications",
              e.target.checked,
            )
          }
        />
        <ToggleRow
          label="Email Notifications"
          desc="Send all alerts to your registered email"
          checked={settings.notifications.emailNotifications || false}
          onChange={(e) =>
            handleChange(
              "notifications",
              "emailNotifications",
              e.target.checked,
            )
          }
        />
        <ToggleRow
          label="Notification Sound"
          desc="Play a sound when new notifications arrive"
          checked={settings.notifications.soundEnabled || false}
          onChange={(e) =>
            handleChange("notifications", "soundEnabled", e.target.checked)
          }
        />

        <SectionLabel>Expiry Reminders</SectionLabel>
        <ToggleRow
          label="Membership Expiry Alerts"
          desc="Warn before a member's plan expires"
          checked={settings.notifications.expiryAlerts || false}
          onChange={(e) =>
            handleChange("notifications", "expiryAlerts", e.target.checked)
          }
        />
        {settings.notifications.expiryAlerts && (
          <div className="px-4 pt-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Alert this many days before expiry
            </label>
            <select
              value={settings.notifications.expiryDaysBefore || "7"}
              onChange={(e) =>
                handleChange(
                  "notifications",
                  "expiryDaysBefore",
                  e.target.value,
                )
              }
              className="input-field max-w-xs"
            >
              <option value="3">3 days</option>
              <option value="5">5 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>
        )}

        <SectionLabel>Quiet Hours</SectionLabel>
        <ToggleRow
          label="Enable Quiet Hours"
          desc="Suppress non-urgent notifications during set hours"
          checked={settings.notifications.quietHours || false}
          onChange={(e) =>
            handleChange("notifications", "quietHours", e.target.checked)
          }
        />
        {settings.notifications.quietHours && (
          <div className="grid grid-cols-2 gap-4 px-4 pt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                From
              </label>
              <input
                type="time"
                value={settings.notifications.quietFrom || "22:00"}
                onChange={(e) =>
                  handleChange("notifications", "quietFrom", e.target.value)
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Until
              </label>
              <input
                type="time"
                value={settings.notifications.quietUntil || "07:00"}
                onChange={(e) =>
                  handleChange("notifications", "quietUntil", e.target.value)
                }
                className="input-field"
              />
            </div>
          </div>
        )}
      </div>
    ),
    [settings.notifications, handleChange],
  );

  const COLOR_OPTIONS = [
    { value: "blue", cls: "bg-blue-500" },
    { value: "indigo", cls: "bg-indigo-500" },
    { value: "purple", cls: "bg-purple-500" },
    { value: "green", cls: "bg-green-500" },
    { value: "teal", cls: "bg-teal-500" },
    { value: "orange", cls: "bg-orange-500" },
    { value: "red", cls: "bg-red-500" },
    { value: "pink", cls: "bg-pink-500" },
  ];

  const FONTS = [
    { value: "inter", label: "Inter" },
    { value: "poppins", label: "Poppins" },
    { value: "roboto", label: "Roboto" },
    { value: "nunito", label: "Nunito" },
  ];

  const renderAppearance = useCallback(() => {
    const theme = settings.appearance.theme || "light";
    const color = settings.appearance.primaryColor || "blue";
    const font = settings.appearance.fontFamily || "inter";

    return (
      <div className="space-y-3">
        <SectionLabel>Theme</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", label: "Light", Icon: Sun },
            { value: "dark", label: "Dark", Icon: Moon },
            { value: "system", label: "System", Icon: Monitor },
          ].map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => handleChange("appearance", "theme", value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <SectionLabel>Primary Color</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {COLOR_OPTIONS.map(({ value, cls }) => (
            <button
              key={value}
              title={value}
              onClick={() => handleChange("appearance", "primaryColor", value)}
              className={`w-9 h-9 rounded-full ${cls} transition-all ${
                color === value
                  ? "ring-2 ring-offset-2 ring-gray-800 dark:ring-white scale-110"
                  : "opacity-60 hover:opacity-100 hover:scale-105"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Selected:{" "}
          <span className="font-medium text-gray-600 dark:text-gray-300 capitalize">
            {color}
          </span>{" "}
          — save to apply across all pages
        </p>

        <SectionLabel>Font Family</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {FONTS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleChange("appearance", "fontFamily", value)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                font === value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <p
                className={`text-sm font-semibold capitalize ${font === value ? "text-primary-600 dark:text-primary-400" : "text-gray-800 dark:text-gray-200"}`}
              >
                {label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                The quick brown fox
              </p>
            </button>
          ))}
        </div>

        <SectionLabel>Layout</SectionLabel>
        <ToggleRow
          label="Compact View"
          desc="Reduce spacing to show more data per screen"
          checked={settings.appearance.compactView || false}
          onChange={(e) =>
            handleChange("appearance", "compactView", e.target.checked)
          }
        />
        <ToggleRow
          label="Collapsed Sidebar"
          desc="Start with sidebar minimized on login"
          checked={settings.appearance.sidebarCollapsed || false}
          onChange={(e) =>
            handleChange("appearance", "sidebarCollapsed", e.target.checked)
          }
        />
        <ToggleRow
          label="Animations"
          desc="Enable transition animations across the UI"
          checked={settings.appearance.animations !== false}
          onChange={(e) =>
            handleChange("appearance", "animations", e.target.checked)
          }
        />
        <ToggleRow
          label="Show Member Avatars"
          desc="Display initials avatars in member lists"
          checked={settings.appearance.showAvatars !== false}
          onChange={(e) =>
            handleChange("appearance", "showAvatars", e.target.checked)
          }
        />

        <SectionLabel>Table Density</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          {["comfortable", "standard", "compact"].map((d) => (
            <button
              key={d}
              onClick={() => handleChange("appearance", "tableDensity", d)}
              className={`py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                (settings.appearance.tableDensity || "standard") === d
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    );
  }, [settings.appearance, handleChange]);

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneral();
      case "notifications":
        return renderNotifications();
      case "appearance":
        return renderAppearance();
      default:
        return renderGeneral();
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your gym management system</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-52">
          <div className="card p-2 space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors text-sm ${
                  activeTab === tab.id
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {activeTab}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <RotateCcw className="h-4 w-4" /> Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
