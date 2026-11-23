import React, { useState, useEffect } from "react";
import { announcementsAPI } from "../services/api";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Pin,
  Bell,
  Calendar,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../components/Common/Modal";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetAudience: "all",
    priority: "medium",
    pinned: false,
    expiresAt: "",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementsAPI.getAll();
      setAnnouncements(response.data.data);
    } catch (error) {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAnnouncement) {
        await announcementsAPI.update(editingAnnouncement.id, formData);
        toast.success("Announcement updated successfully");
      } else {
        await announcementsAPI.create(formData);
        toast.success("Announcement created successfully");
      }
      window.dispatchEvent(new CustomEvent("notification-read"));
      setShowModal(false);
      setEditingAnnouncement(null);
      setFormData({
        title: "",
        content: "",
        targetAudience: "all",
        priority: "medium",
        pinned: false,
        expiresAt: "",
      });
      fetchAnnouncements();
    } catch (error) {
      toast.error(
        editingAnnouncement
          ? "Failed to update announcement"
          : "Failed to create announcement",
      );
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.targetAudience,
      priority: announcement.priority,
      pinned: announcement.pinned,
      expiresAt: announcement.expiresAt || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await announcementsAPI.delete(id);
        toast.success("Announcement deleted successfully");
        window.dispatchEvent(new CustomEvent("notification-read"));
        fetchAnnouncements();
      } catch (error) {
        toast.error("Failed to delete announcement");
      }
    }
  };

  const handlePinToggle = async (id, currentPinned) => {
    try {
      await announcementsAPI.update(id, { pinned: !currentPinned });
      toast.success("Announcement pin status updated");
      window.dispatchEvent(new CustomEvent("notification-read"));
      fetchAnnouncements();
    } catch (error) {
      toast.error("Failed to update pin status");
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700",
    };
    return colors[priority] || colors.medium;
  };

  const getTargetBadge = (target) => {
    const labels = {
      all: "All Users",
      members: "Members Only",
      staff: "Staff Only",
    };
    return labels[target] || labels.all;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const pinnedAnnouncements = announcements.filter((a) => a.pinned);
  const regularAnnouncements = announcements.filter((a) => !a.pinned);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">
            Manage gym announcements and notifications
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAnnouncement(null);
            setFormData({
              title: "",
              content: "",
              targetAudience: "all",
              priority: "medium",
              pinned: false,
              expiresAt: "",
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Announcement
        </button>
      </div>

      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Pin className="h-5 w-5 text-primary-600" />
            Pinned Announcements
          </h3>
          {pinnedAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="card border-l-4 border-l-primary-500"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {announcement.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(announcement.priority)}`}
                  >
                    {announcement.priority}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handlePinToggle(announcement.id, announcement.pinned)
                    }
                    className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mb-3">{announcement.content}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {getTargetBadge(announcement.targetAudience)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expires: {announcement.expiresAt || "Never"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Announcements
        </h3>
        {regularAnnouncements.map((announcement) => (
          <div key={announcement.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {announcement.title}
                </h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(announcement.priority)}`}
                >
                  {announcement.priority}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handlePinToggle(announcement.id, announcement.pinned)
                  }
                  className="p-1 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                >
                  <Pin className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEdit(announcement)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-3">{announcement.content}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {getTargetBadge(announcement.targetAudience)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: {announcement.createdAt}
              </span>
            </div>
          </div>
        ))}

        {regularAnnouncements.length === 0 &&
          pinnedAnnouncements.length === 0 && (
            <div className="card text-center py-12">
              <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No announcements yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create First Announcement
              </button>
            </div>
          )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          editingAnnouncement ? "Edit Announcement" : "Create Announcement"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="input-field"
              placeholder="Enter announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              required
              rows="4"
              className="input-field"
              placeholder="Enter announcement content"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value })
                }
                className="input-field"
              >
                <option value="all">All Users</option>
                <option value="members">Members Only</option>
                <option value="staff">Staff Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
                className="input-field"
              />
            </div>

            <div className="flex items-center gap-3 pt-7">
              <input
                type="checkbox"
                checked={formData.pinned}
                onChange={(e) =>
                  setFormData({ ...formData, pinned: e.target.checked })
                }
                className="h-4 w-4 text-primary-600 rounded border-gray-300"
              />
              <label className="text-sm font-medium text-gray-700">
                Pin this announcement
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingAnnouncement ? "Update" : "Create"} Announcement
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Announcements;
