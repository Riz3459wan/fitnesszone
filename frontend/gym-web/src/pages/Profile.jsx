import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import { User, Mail, Phone, Key, Save, Camera } from "lucide-react";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, gym, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const loadUserProfile = useCallback(async () => {
    console.log(user);
    if (!user?.userId) return;
    setLoadingProfile(true);
    try {
      const response = await userAPI.getById(user.userId);
      if (response.data.success) {
        const userData = response.data.data;
        setProfileData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phone: userData.phone || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleProfileChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleUpdateProfile = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await userAPI.update(user?.userId, profileData);
        await fetchUserProfile(user?.userId);
        toast.success("Profile updated successfully");
      } catch (error) {
        toast.error("Failed to update profile");
      } finally {
        setLoading(false);
      }
    },
    [user?.userId, profileData, fetchUserProfile],
  );

  const handleChangePassword = useCallback(
    async (e) => {
      e.preventDefault();
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
      if (passwordData.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      setLoading(true);
      try {
        await userAPI.changePassword({
          userId: user?.userId,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
        toast.success("Password changed successfully");
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to change password",
        );
      } finally {
        setLoading(false);
      }
    },
    [user?.userId, passwordData],
  );

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account information
        </p>
      </div>

      <div className="card">
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center transition-colors">
              <User className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
            <button
              className="absolute bottom-0 right-0 p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 transition-colors"
              aria-label="Change avatar"
            >
              <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.username}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Role: {user?.role} | Gym: {gym?.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="h-4 w-4 inline mr-2" /> Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={profileData.fullName}
              onChange={handleProfileChange}
              disabled={loading}
              className="input-field"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="h-4 w-4 inline mr-2" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              disabled={loading}
              className="input-field"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="h-4 w-4 inline mr-2" /> Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={profileData.phone}
              onChange={handleProfileChange}
              disabled={loading}
              className="input-field"
              placeholder="Enter your phone number"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save className="h-5 w-5" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Password
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Change your password
            </p>
          </div>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Key className="h-5 w-5" /> Change Password
            </button>
          )}
        </div>
        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                disabled={loading}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                disabled={loading}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                disabled={loading}
                className="input-field"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                Update Password
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                disabled={loading}
                className="btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
