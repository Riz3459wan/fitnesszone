import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { userAPI } from "../services/api";
import { Save, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    role: "STAFF",
    fullName: "",
    phone: "",
    active: true,
  });

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setFetching(true);
    try {
      const response = await userAPI.getById(id);
      const user = response.data.data;
      setFormData({
        username: user.username,
        password: "",
        email: user.email,
        role: user.role,
        fullName: user.fullName || "",
        phone: user.phone || "",
        active: user.active,
      });
    } catch (error) {
      toast.error("Failed to load user");
      navigate("/users", { replace: true });
    } finally {
      setFetching(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) fetchUser();
  }, [id, fetchUser]);

  const handleChange = useCallback((e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (id) {
          await userAPI.update(id, formData);
          toast.success("User updated successfully");
        } else {
          await userAPI.create(formData);
          toast.success("User created successfully");
        }
        navigate("/users");
      } catch (error) {
        toast.error(id ? "Failed to update user" : "Failed to create user");
      } finally {
        setLoading(false);
      }
    },
    [id, formData, navigate],
  );

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/users")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {id ? "Edit User" : "Add New User"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {id ? "Update user information" : "Create a new system user"}
          </p>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter username"
              disabled={!!id || loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {id ? "New Password (leave blank to keep current)" : "Password *"}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!id}
              disabled={loading}
              className="input-field"
              placeholder="Enter password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="input-field"
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
              className="input-field"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className="input-field"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              className="input-field"
            >
              <option value="ADMIN">Admin</option>
              <option value="TRAINER">Trainer</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              disabled={loading}
              className="h-4 w-4 text-primary-600 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-primary-500"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Account
            </label>
          </div>
          <div className="flex gap-3 pt-4">
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
              {id ? "Update User" : "Create User"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/users")}
              disabled={loading}
              className="btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
