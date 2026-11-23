import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { memberAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Power } from "lucide-react";
import toast from "react-hot-toast";
import SearchBar from "../components/Common/SearchBar";
import ConfirmDialog from "../components/Common/ConfirmDialog";
import EmptyState from "../components/Common/EmptyState";
import Loader from "../components/Common/Loader";
import Pagination from "../components/Common/Pagination";

const DENSITY_CLASS = {
  comfortable: "py-4",
  standard: "py-3",
  compact: "py-1.5",
};

const Avatar = ({ name }) => {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";
  return (
    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
        {initials}
      </span>
    </div>
  );
};

const Members = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatDate, appearance } = useSettings();
  const showAvatars = appearance?.showAvatars !== false;
  const density =
    DENSITY_CLASS[appearance?.tableDensity] || DENSITY_CLASS.standard;

  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    id: null,
    name: "",
    currentStatus: false,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isAdmin = user?.role === "ADMIN";

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await memberAPI.getAll();
      setMembers(response.data.data);
      setFilteredMembers(response.data.data);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearch = useCallback(
    (query) => {
      setCurrentPage(1);
      if (!query.trim()) {
        setFilteredMembers(members);
        return;
      }
      const q = query.toLowerCase();
      setFilteredMembers(
        members.filter(
          (m) =>
            m.name?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q) ||
            m.registrationNumber?.toLowerCase().includes(q),
        ),
      );
    },
    [members],
  );

  const handleToggleStatus = useCallback(async () => {
    try {
      const newStatus = !statusDialog.currentStatus;
      await memberAPI.updateStatus(statusDialog.id, newStatus);
      toast.success(
        `Member ${newStatus ? "activated" : "deactivated"} successfully`,
      );
      await fetchMembers();
    } catch {
      toast.error("Failed to update member status");
    } finally {
      setStatusDialog({
        open: false,
        id: null,
        name: "",
        currentStatus: false,
      });
    }
  }, [statusDialog.id, statusDialog.currentStatus, fetchMembers]);

  const handleDelete = useCallback(async () => {
    try {
      await memberAPI.delete(deleteDialog.id);
      toast.success("Member deleted");
      await fetchMembers();
    } catch {
      toast.error("Failed to delete member");
    } finally {
      setDeleteDialog({ open: false, id: null, name: "" });
    }
  }, [deleteDialog.id, fetchMembers]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">Manage your gym members</p>
        </div>
        <button
          onClick={() => navigate("/members/new")}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Add Member
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by name, email or reg. number..."
          />
        </div>

        {filteredMembers.length === 0 ? (
          <EmptyState
            title="No members found"
            message="Add your first member to get started."
            action={
              <button
                onClick={() => navigate("/members/new")}
                className="btn-primary"
              >
                Add Member
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    <th className="table-header">Status</th>
                    <th className="table-header">Reg. Number</th>
                    <th className="table-header">Name</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Phone</th>
                    <th className="table-header">Membership</th>
                    <th className="table-header">Join Date</th>
                    {isAdmin && (
                      <th className="table-header text-center">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {paginatedMembers.map((member) => (
                    <tr key={member.id} className="table-row">
                      <td className={`table-cell ${density}`}>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            member.active !== false
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {member.active !== false ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {member.active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={`table-cell font-mono ${density}`}>
                        {member.registrationNumber || "—"}
                      </td>
                      <td className={`table-cell font-medium ${density}`}>
                        <div className="flex items-center gap-2">
                          {showAvatars && <Avatar name={member.name} />}
                          <span
                            className={
                              member.active === false
                                ? "text-gray-400 line-through"
                                : "text-gray-900 dark:text-white"
                            }
                          >
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className={`table-cell ${density}`}>
                        {member.email}
                      </td>
                      <td className={`table-cell ${density}`}>
                        {member.phone}
                      </td>
                      <td className={`table-cell ${density}`}>
                        <span className="badge badge-blue">
                          {member.membershipType}
                        </span>
                      </td>
                      <td className={`table-cell ${density}`}>
                        {formatDate(member.joinDate)}
                      </td>
                      {isAdmin && (
                        <td className={`table-cell text-center ${density}`}>
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() =>
                                setStatusDialog({
                                  open: true,
                                  id: member.id,
                                  name: member.name,
                                  currentStatus: member.active !== false,
                                })
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                member.active !== false
                                  ? "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                                  : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              }`}
                              title={
                                member.active !== false
                                  ? "Deactivate"
                                  : "Activate"
                              }
                            >
                              <Power className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/members/edit/${member.id}`)
                              }
                              className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  id: member.id,
                                  name: member.name,
                                })
                              }
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Status Toggle Confirm Dialog */}
      <ConfirmDialog
        isOpen={statusDialog.open}
        onClose={() =>
          setStatusDialog({
            open: false,
            id: null,
            name: "",
            currentStatus: false,
          })
        }
        onConfirm={handleToggleStatus}
        title={
          statusDialog.currentStatus ? "Deactivate Member" : "Activate Member"
        }
        message={`Are you sure you want to ${statusDialog.currentStatus ? "deactivate" : "activate"} ${statusDialog.name}?`}
        confirmText={statusDialog.currentStatus ? "Deactivate" : "Activate"}
        cancelText="Cancel"
      />

      {isAdmin && (
        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, id: null, name: "" })}
          onConfirm={handleDelete}
          title="Delete Member"
          message={`Are you sure you want to delete ${deleteDialog.name}? This cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default Members;
