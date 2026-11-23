import React, { useState, useEffect, useCallback, useMemo } from "react";
import { attendanceAPI } from "../services/api";
import { useSettings } from "../context/SettingsContext";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "../components/Common/Pagination";

const DENSITY_CLASS = {
  comfortable: "py-4",
  standard: "py-3",
  compact: "py-1.5",
};

const Attendance = () => {
  const { formatTime, appearance } = useSettings();
  const density =
    DENSITY_CLASS[appearance?.tableDensity] || DENSITY_CLASS.standard;

  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAttendance = useCallback(async () => {
    const response = await attendanceAPI.getByDate(selectedDate);
    setAttendance(response.data.data);
    setCurrentPage(1);
  }, [selectedDate]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await attendanceAPI.getStats();
      setStats(response.data.data);
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAttendance(), fetchStats()]);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [fetchAttendance, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckIn = useCallback(
    async (memberId) => {
      setActionLoading(memberId);
      try {
        await attendanceAPI.checkIn(memberId);
        toast.success("Checked in");
        window.dispatchEvent(new CustomEvent("notification-read"));
        await loadData();
      } catch {
        toast.error("Failed to check in");
      } finally {
        setActionLoading(null);
      }
    },
    [loadData],
  );

  const handleCheckOut = useCallback(
    async (memberId) => {
      setActionLoading(memberId);
      try {
        await attendanceAPI.checkOut(memberId);
        toast.success("Checked out");
        window.dispatchEvent(new CustomEvent("notification-read"));
        await loadData();
      } catch {
        toast.error("Failed to check out");
      } finally {
        setActionLoading(null);
      }
    },
    [loadData],
  );

  const paginatedAttendance = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return attendance.slice(start, start + itemsPerPage);
  }, [attendance, currentPage]);

  const totalPages = Math.ceil(attendance.length / itemsPerPage);

  const statCards = stats
    ? [
        {
          label: "Present Today",
          value: stats.present,
          icon: CheckCircle,
          bg: "bg-green-100 dark:bg-green-900/20",
          text: "text-green-600 dark:text-green-400",
        },
        {
          label: "Absent Today",
          value: stats.absent,
          icon: XCircle,
          bg: "bg-red-100 dark:bg-red-900/20",
          text: "text-red-500 dark:text-red-400",
        },
        {
          label: "Attendance Rate",
          value: `${stats.attendanceRate}%`,
          icon: Clock,
          bg: "bg-blue-100 dark:bg-blue-900/20",
          text: "text-blue-600 dark:text-blue-400",
        },
      ]
    : [];

  if (loading)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Track member check-ins and check-outs</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map(({ label, value, icon: Icon, bg, text }) => (
            <div key={label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${bg}`}>
                  <Icon className={`h-6 w-6 ${text}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field w-auto"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th className="table-header">Member Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Check In</th>
                <th className="table-header">Check Out</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {paginatedAttendance.map((record) => (
                <tr key={record.memberId} className="table-row">
                  <td
                    className={`table-cell font-medium text-gray-900 dark:text-white ${density}`}
                  >
                    {record.name}
                  </td>
                  <td className={`table-cell ${density}`}>{record.email}</td>
                  <td className={`table-cell ${density}`}>
                    {record.checkIn && record.checkIn !== "-"
                      ? formatTime(record.checkIn)
                      : "—"}
                  </td>
                  <td className={`table-cell ${density}`}>
                    {record.checkOut && record.checkOut !== "-"
                      ? formatTime(record.checkOut)
                      : "—"}
                  </td>
                  <td className={`table-cell ${density}`}>
                    {record.status === "Present" ? (
                      <span className="badge badge-green flex items-center gap-1 w-fit">
                        <CheckCircle className="h-3 w-3" /> Present
                      </span>
                    ) : (
                      <span className="badge badge-red flex items-center gap-1 w-fit">
                        <XCircle className="h-3 w-3" /> Absent
                      </span>
                    )}
                  </td>
                  <td className={`table-cell ${density}`}>
                    {record.status === "Absent" && (
                      <button
                        onClick={() => handleCheckIn(record.memberId)}
                        disabled={actionLoading === record.memberId}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium disabled:opacity-40"
                      >
                        {actionLoading === record.memberId ? "..." : "Check In"}
                      </button>
                    )}
                    {record.status === "Present" && record.checkOut === "-" && (
                      <button
                        onClick={() => handleCheckOut(record.memberId)}
                        disabled={actionLoading === record.memberId}
                        className="text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium disabled:opacity-40"
                      >
                        {actionLoading === record.memberId
                          ? "..."
                          : "Check Out"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendance.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              No attendance records for this date
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
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

export default Attendance;
