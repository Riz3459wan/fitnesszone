import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import { Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";
import SearchBar from "../components/Common/SearchBar";
import ConfirmDialog from "../components/Common/ConfirmDialog";
import EmptyState from "../components/Common/EmptyState";
import Loader from "../components/Common/Loader";
import Pagination from "../components/Common/Pagination";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    username: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.data);
      setFilteredUsers(response.data.data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = useCallback(
    (query) => {
      if (!query.trim()) setFilteredUsers(users);
      else
        setFilteredUsers(
          users.filter(
            (u) =>
              u.username.toLowerCase().includes(query.toLowerCase()) ||
              u.email.toLowerCase().includes(query.toLowerCase()) ||
              (u.fullName &&
                u.fullName.toLowerCase().includes(query.toLowerCase())),
          ),
        );
      setCurrentPage(1);
    },
    [users],
  );

  const handleDelete = useCallback(async () => {
    try {
      await userAPI.delete(deleteDialog.id);
      toast.success("User deleted");
      await fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setDeleteDialog({ open: false, id: null, username: "" });
    }
  }, [deleteDialog.id, fetchUsers]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage system users</p>
        </div>
        <button
          onClick={() => navigate("/users/new")}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Add User
        </button>
      </div>
      <div className="card">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search by username, email, or name..."
          className="mb-4"
        />
        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            message="Add a new user to get started."
            action={
              <button
                onClick={() => navigate("/users/new")}
                className="btn-primary"
              >
                Add User
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    <th className="table-header">Username</th>
                    <th className="table-header">Full Name</th>
                    <th className="table-header">Email</th>
                    <th className="table-header">Role</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {user.fullName || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.active ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <UserCheck className="h-4 w-4" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <UserX className="h-4 w-4" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/users/edit/${user.id}`)}
                            className="p-1 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                id: user.id,
                                username: user.username,
                              })
                            }
                            className="p-1 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
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
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, username: "" })}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Delete user "${deleteDialog.username}"?`}
        confirmText="Delete"
      />
    </div>
  );
};

export default Users;
