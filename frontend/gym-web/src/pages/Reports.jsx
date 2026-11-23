import React, { useState, useEffect, useCallback, useMemo } from "react";
import { reportAPI, memberAPI } from "../services/api";
import { useSettings } from "../context/SettingsContext";
import {
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Download,
  TrendingUp,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const REPORT_TYPES = [
  {
    id: "members",
    label: "Member Report",
    icon: Users,
    desc: "New joins, plans, attendance summary",
  },
  {
    id: "attendance",
    label: "Attendance Report",
    icon: CalendarCheck,
    desc: "Daily member-wise check-in/out",
  },
  {
    id: "payments",
    label: "Payment Report",
    icon: CreditCard,
    desc: "Paid, pending, overdue transactions",
  },
  {
    id: "revenue",
    label: "Revenue Report",
    icon: BarChart3,
    desc: "Monthly, plan-wise revenue",
  },
];

const QUICK_RANGES = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "This Month", days: null, thisMonth: true },
  { label: "Last 30 days", days: 30 },
  { label: "Last 3 months", days: 90 },
];

const toISO = (d) => d.toISOString().split("T")[0];

const Reports = () => {
  const { formatCurrency, formatDate } = useSettings();

  const [reportType, setReportType] = useState("members");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return toISO(d);
  });
  const [endDate, setEndDate] = useState(() => toISO(new Date()));

  const [memberSearch, setMemberSearch] = useState("");
  const [allMembers, setAllMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    memberAPI
      .getAll()
      .then((res) => {
        setAllMembers(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!memberSearch.trim()) {
      setFilteredMembers([]);
      return;
    }
    const term = memberSearch.toLowerCase();
    setFilteredMembers(
      allMembers
        .filter(
          (m) =>
            m.name?.toLowerCase().includes(term) || m.phone?.includes(term),
        )
        .slice(0, 8),
    );
  }, [memberSearch, allMembers]);

  const applyQuickRange = useCallback((range) => {
    const today = new Date();
    if (range.thisMonth) {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toISO(first));
      setEndDate(toISO(today));
    } else if (range.days === 0) {
      setStartDate(toISO(today));
      setEndDate(toISO(today));
    } else {
      const from = new Date(today);
      from.setDate(today.getDate() - range.days);
      setStartDate(toISO(from));
      setEndDate(toISO(today));
    }
  }, []);

  const generateReport = useCallback(async () => {
    setLoading(true);
    setReportData(null);
    setCurrentPage(1);
    try {
      let response;
      const memberId = selectedMember?.id || null;
      if (reportType === "members")
        response = await reportAPI.getMembers(startDate, endDate, memberId);
      else if (reportType === "attendance")
        response = await reportAPI.getAttendance(startDate, endDate, memberId);
      else if (reportType === "payments")
        response = await reportAPI.getPayments(startDate, endDate, memberId);
      else response = await reportAPI.getRevenue(startDate, endDate);
      setReportData(response.data.data);
      toast.success("Report generated");
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate, selectedMember]);

  const exportCSV = useCallback(() => {
    if (!reportData?.rows?.length) return;
    const rows = reportData.rows;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [reportData, reportType, startDate, endDate]);

  const paginatedRows = useMemo(() => {
    if (!reportData?.rows) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return reportData.rows.slice(start, start + PAGE_SIZE);
  }, [reportData, currentPage]);

  const totalPages = useMemo(() => {
    if (!reportData?.rows) return 1;
    return Math.ceil(reportData.rows.length / PAGE_SIZE);
  }, [reportData]);

  const renderSummaryCards = useCallback(() => {
    if (!reportData?.summary) return null;
    const s = reportData.summary;
    const cards = [];

    if (reportType === "members") {
      cards.push({ label: "Total Members", value: s.totalMembers });
      cards.push({ label: "Active Members", value: s.activeMembers });
      cards.push({
        label: "Total Revenue",
        value: formatCurrency(s.totalRevenue),
      });
    } else if (reportType === "attendance") {
      cards.push({ label: "Total Records", value: s.totalRecords });
      cards.push({ label: "Present", value: s.presentCount });
      cards.push({ label: "Attendance Rate", value: `${s.attendanceRate}%` });
      cards.push({ label: "Unique Members", value: s.uniqueMembers });
    } else if (reportType === "payments") {
      cards.push({ label: "Total Transactions", value: s.totalTransactions });
      cards.push({ label: "Total Paid", value: formatCurrency(s.totalPaid) });
      cards.push({ label: "Pending", value: formatCurrency(s.totalPending) });
      cards.push({ label: "Paid Count", value: s.paidCount });
    } else if (reportType === "revenue") {
      cards.push({
        label: "Total Revenue",
        value: formatCurrency(s.totalRevenue),
      });
      cards.push({ label: "Transactions", value: s.totalTransactions });
      cards.push({ label: "Paid", value: s.paidTransactions });
      cards.push({
        label: "Avg Transaction",
        value: formatCurrency(s.avgTransaction),
      });
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {cards.map((c, i) => (
          <div
            key={i}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 transition-colors"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {c.label}
            </p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {c.value}
            </p>
          </div>
        ))}
      </div>
    );
  }, [reportData, reportType, formatCurrency]);

  const renderTableHeaders = useCallback(() => {
    if (reportType === "members") {
      return [
        "Name",
        "Email",
        "Phone",
        "Plan",
        "Join Date",
        "Attendance",
        "Amount Paid",
        "Status",
      ];
    } else if (reportType === "attendance") {
      return ["Member", "Date", "Check In", "Check Out", "Status"];
    } else if (reportType === "payments" || reportType === "revenue") {
      return ["Member", "Plan", "Amount", "Date", "Status"];
    }
    return [];
  }, [reportType]);

  const renderTableRow = useCallback(
    (row, i) => {
      if (reportType === "members") {
        return (
          <tr
            key={i}
            className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
              {row.name}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {row.email}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {row.phone}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {row.plan}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {formatDate(row.joinDate)}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              <span
                className={
                  row.attendanceRate < 50
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }
              >
                {row.attendanceDays}/{row.totalDays} ({row.attendanceRate}%)
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
              {formatCurrency(row.amountPaid)}
            </td>
            <td className="px-4 py-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  row.status === "Active"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                }`}
              >
                {row.status}
              </span>
            </td>
          </tr>
        );
      } else if (reportType === "attendance") {
        return (
          <tr
            key={i}
            className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
              {row.memberName}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {formatDate(row.date)}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {row.checkIn}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {row.checkOut}
            </td>
            <td className="px-4 py-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  row.status === "Present"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}
              >
                {row.status}
              </span>
            </td>
          </tr>
        );
      } else {
        return (
          <tr
            key={i}
            className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
              {row.member}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {row.plan}
            </td>
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
              {formatCurrency(row.amount)}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {formatDate(row.paymentDate)}
            </td>
            <td className="px-4 py-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  row.status === "Paid"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                }`}
              >
                {row.status}
              </span>
            </td>
          </tr>
        );
      }
    },
    [reportType, formatDate, formatCurrency],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">
            Generate filtered reports for members, attendance, payments and
            revenue
          </p>
        </div>
        {reportData?.rows?.length > 0 && (
          <button
            onClick={exportCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.id}
            onClick={() => {
              setReportType(rt.id);
              setReportData(null);
            }}
            className={`text-left p-4 rounded-lg border transition-all ${
              reportType === rt.id
                ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <rt.icon
              className={`h-5 w-5 mb-2 ${
                reportType === rt.id
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            />
            <p
              className={`text-sm font-medium ${
                reportType === rt.id
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {rt.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {rt.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="card">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Filters
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {reportType !== "revenue" && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Member (optional)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={selectedMember ? selectedMember.name : memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setSelectedMember(null);
                    setShowMemberDropdown(true);
                  }}
                  onFocus={() => setShowMemberDropdown(true)}
                  placeholder="All members"
                  className="input-field pl-9 pr-8"
                />
                {selectedMember && (
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      setMemberSearch("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </button>
                )}
              </div>
              {showMemberDropdown && filteredMembers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m);
                        setMemberSearch("");
                        setShowMemberDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {m.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {m.phone}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 py-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
            Generate
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mt-3">
          {QUICK_RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => applyQuickRange(r)}
              className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {reportData && (
        <div className="space-y-4">
          {renderSummaryCards()}

          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {REPORT_TYPES.find((r) => r.id === reportType)?.label} —{" "}
                {formatDate(startDate)} to {formatDate(endDate)}
                {selectedMember && (
                  <span className="text-primary-600 dark:text-primary-400 ml-2">
                    · {selectedMember.name}
                  </span>
                )}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                {reportData.rows?.length || 0} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    {renderTableHeaders().map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, i) => renderTableRow(row, i))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {totalPages} · {reportData.rows?.length}{" "}
                  records
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-xs px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="text-xs px-3 py-1 bg-primary-600 text-white rounded-md disabled:opacity-40 hover:bg-primary-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!reportData && !loading && (
        <div className="card text-center py-16">
          <TrendingUp className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Select report type and click Generate
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Optionally filter by member and date range
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;
