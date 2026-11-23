import React, { useState, useEffect, useCallback, useMemo } from "react";
import { paymentAPI, memberAPI, planAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useRazorpay } from "../hooks/useRazorpay";
import {
  IndianRupee,
  CreditCard,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Smartphone,
} from "lucide-react";
import toast from "react-hot-toast";
import SearchBar from "../components/Common/SearchBar";
import Modal from "../components/Common/Modal";
import ConfirmDialog from "../components/Common/ConfirmDialog";
import Loader from "../components/Common/Loader";
import EmptyState from "../components/Common/EmptyState";
import Pagination from "../components/Common/Pagination";

const DENSITY_CLASS = {
  comfortable: "py-4",
  standard: "py-3",
  compact: "py-1.5",
};

const Payments = () => {
  const { user } = useAuth();
  const { formatCurrency, formatDate, appearance } = useSettings();
  const { pay } = useRazorpay();
  const density =
    DENSITY_CLASS[appearance?.tableDensity] || DENSITY_CLASS.standard;

  const isAdmin = user?.role === "ADMIN";

  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedMemberForOnline, setSelectedMemberForOnline] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    memberName: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    memberId: "",
    amount: "",
    plan: "",
    status: "Paid",
  });
  const [editFormData, setEditFormData] = useState({
    id: "",
    amount: "",
    status: "",
    plan: "",
    paymentDate: "",
  });
  const [onlineFormData, setOnlineFormData] = useState({
    memberId: "",
    amount: "",
    plan: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, membersRes, plansRes, summaryRes] = await Promise.all(
        [
          paymentAPI.getAll(),
          memberAPI.getAll(),
          planAPI.getAll(),
          paymentAPI.getSummary(),
        ],
      );
      setPayments(paymentsRes.data.data);
      setFilteredPayments(paymentsRes.data.data);
      setMembers(membersRes.data.data);
      setPlans(plansRes.data.data);
      setSummary(summaryRes.data.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (formData.memberId && members.length && plans.length) {
      const member = members.find((m) => m.id === parseInt(formData.memberId));
      if (member?.membershipType) {
        const plan = plans.find((p) => p.name === member.membershipType);
        if (plan) {
          setFormData((prev) => ({
            ...prev,
            plan: plan.name,
            amount: plan.price.toString(),
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            plan: member.membershipType,
            amount: "",
          }));
        }
      } else {
        setFormData((prev) => ({ ...prev, plan: "", amount: "" }));
      }
    } else if (!formData.memberId) {
      setFormData((prev) => ({ ...prev, plan: "", amount: "" }));
    }
  }, [formData.memberId, members, plans]);

  useEffect(() => {
    if (onlineFormData.memberId && members.length && plans.length) {
      const member = members.find(
        (m) => m.id === parseInt(onlineFormData.memberId),
      );
      if (member?.membershipType) {
        const plan = plans.find((p) => p.name === member.membershipType);
        if (plan) {
          setOnlineFormData((prev) => ({
            ...prev,
            plan: plan.name,
            amount: plan.price.toString(),
          }));
          setSelectedMemberForOnline(member);
        } else {
          setOnlineFormData((prev) => ({
            ...prev,
            plan: member.membershipType,
            amount: "",
          }));
          setSelectedMemberForOnline(member);
        }
      } else {
        setOnlineFormData((prev) => ({ ...prev, plan: "", amount: "" }));
        setSelectedMemberForOnline(member || null);
      }
    } else if (!onlineFormData.memberId) {
      setOnlineFormData((prev) => ({ ...prev, plan: "", amount: "" }));
      setSelectedMemberForOnline(null);
    }
  }, [onlineFormData.memberId, members, plans]);

  const handleSearch = useCallback(
    (query) => {
      setCurrentPage(1);
      if (!query.trim()) {
        setFilteredPayments(payments);
        return;
      }
      const q = query.toLowerCase();
      setFilteredPayments(
        payments.filter(
          (p) =>
            p.member?.toLowerCase().includes(q) ||
            p.phone?.toLowerCase().includes(q),
        ),
      );
    },
    [payments],
  );

  const handleAddPayment = useCallback(
    async (e) => {
      e.preventDefault();
      if (!formData.memberId || !formData.amount) {
        toast.error("Select a member and enter amount");
        return;
      }
      try {
        await paymentAPI.create({
          memberId: parseInt(formData.memberId),
          amount: parseFloat(formData.amount),
          plan: formData.plan,
          status: formData.status,
        });
        toast.success("Payment recorded");
        window.dispatchEvent(new CustomEvent("notification-read"));
        setShowAddModal(false);
        setFormData({ memberId: "", amount: "", plan: "", status: "Paid" });
        await fetchData();
      } catch {
        toast.error("Failed to record payment");
      }
    },
    [formData, fetchData],
  );

  const handleEditPayment = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await paymentAPI.update(editFormData.id, {
          amount: parseFloat(editFormData.amount),
          status: editFormData.status,
          plan: editFormData.plan,
          paymentDate: editFormData.paymentDate,
        });
        toast.success("Payment updated");
        window.dispatchEvent(new CustomEvent("notification-read"));
        setShowEditModal(false);
        await fetchData();
      } catch {
        toast.error("Failed to update payment");
      }
    },
    [editFormData, fetchData],
  );

  const handleDelete = useCallback(async () => {
    try {
      await paymentAPI.delete(deleteDialog.id);
      toast.success("Payment deleted");
      window.dispatchEvent(new CustomEvent("notification-read"));
      await fetchData();
    } catch {
      toast.error("Failed to delete payment");
    } finally {
      setDeleteDialog({ open: false, id: null, memberName: "" });
    }
  }, [deleteDialog.id, fetchData]);

  const handleOnlinePayment = useCallback(async () => {
    if (!onlineFormData.memberId || !onlineFormData.amount) {
      toast.error("Select a member with a plan to proceed");
      return;
    }
    const amountInPaise = Math.round(parseFloat(onlineFormData.amount) * 100);
    setPaymentProcessing(true);
    await pay({
      amount: amountInPaise,
      description: `${selectedMemberForOnline?.name || "Member"} – ${onlineFormData.plan}`,
      prefillName: selectedMemberForOnline?.name || "",
      prefillEmail: selectedMemberForOnline?.email || "",
      prefillPhone: selectedMemberForOnline?.phone || "",
      onSuccess: async () => {
        setShowOnlineModal(false);
        setOnlineFormData({ memberId: "", amount: "", plan: "" });
        setSelectedMemberForOnline(null);
        setPaymentProcessing(false);
        window.dispatchEvent(new CustomEvent("notification-read"));
        await fetchData();
      },
      onFailure: () => {
        setPaymentProcessing(false);
      },
    });
  }, [onlineFormData, selectedMemberForOnline, pay, fetchData]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  if (loading) return <Loader />;

  const summaryCards = summary
    ? [
        {
          label: "Total Revenue",
          value: formatCurrency(summary.totalRevenue),
          icon: IndianRupee,
          bg: "bg-green-100 dark:bg-green-900/20",
          text: "text-green-600 dark:text-green-400",
        },
        {
          label: "Pending Amount",
          value: formatCurrency(summary.pendingAmount),
          icon: CreditCard,
          bg: "bg-yellow-100 dark:bg-yellow-900/20",
          text: "text-yellow-600 dark:text-yellow-400",
        },
        {
          label: "Success Rate",
          value: `${summary.successRate}%`,
          icon: CheckCircle,
          bg: "bg-blue-100 dark:bg-blue-900/20",
          text: "text-blue-600 dark:text-blue-400",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Manage member payments</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setOnlineFormData({ memberId: "", amount: "", plan: "" });
              setSelectedMemberForOnline(null);
              setShowOnlineModal(true);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Smartphone className="h-5 w-5" /> Collect Online
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" /> Record Payment
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {summaryCards.map(({ label, value, icon: Icon, bg, text }) => (
            <div key={label} className="card">
              <div className="flex justify-between items-center">
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
        <div className="mb-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by member name or phone..."
          />
        </div>
        {filteredPayments.length === 0 ? (
          <EmptyState
            title="No payments found"
            message="Record your first payment."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    <th className="table-header">Member</th>
                    <th className="table-header">Plan</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Method</th>
                    {isAdmin && <th className="table-header">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {paginatedPayments.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td
                        className={`table-cell font-medium text-gray-900 dark:text-white ${density}`}
                      >
                        {p.member}
                      </td>
                      <td
                        className={`table-cell text-gray-600 dark:text-gray-400 ${density}`}
                      >
                        {p.plan}
                      </td>
                      <td
                        className={`table-cell font-semibold text-gray-900 dark:text-white ${density}`}
                      >
                        {formatCurrency(p.amount)}
                      </td>
                      <td
                        className={`table-cell text-gray-600 dark:text-gray-400 ${density}`}
                      >
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className={`table-cell ${density}`}>
                        <span
                          className={`badge ${
                            p.status === "Paid" ? "badge-green" : "badge-yellow"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td
                        className={`table-cell text-gray-600 dark:text-gray-400 ${density}`}
                      >
                        <span
                          className={`badge ${
                            p.paymentMethod === "ONLINE"
                              ? "badge-blue"
                              : "badge-gray"
                          }`}
                        >
                          {p.paymentMethod === "ONLINE" ? "Online" : "Manual"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className={`table-cell ${density}`}>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedPayment(p);
                                setShowViewModal(true);
                              }}
                              className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPayment(p);
                                setEditFormData({
                                  id: p.id,
                                  amount: p.amount,
                                  status: p.status,
                                  plan: p.plan,
                                  paymentDate: p.paymentDate,
                                });
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  id: p.id,
                                  memberName: p.member,
                                })
                              }
                              className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
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

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Payment"
      >
        <form onSubmit={handleAddPayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Member
            </label>
            <select
              value={formData.memberId}
              onChange={(e) =>
                setFormData({ ...formData, memberId: e.target.value })
              }
              required
              className="input-field"
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.membershipType || "No plan"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Plan
            </label>
            <input
              type="text"
              value={formData.plan}
              readOnly
              className="input-field bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-80"
              placeholder="Auto-filled from member's plan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
              className="input-field"
              readOnly={!!formData.plan}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="input-field"
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">
            Record Payment
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={showOnlineModal}
        onClose={() => {
          setShowOnlineModal(false);
          setOnlineFormData({ memberId: "", amount: "", plan: "" });
          setSelectedMemberForOnline(null);
        }}
        title="Collect Online Payment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Member
            </label>
            <select
              value={onlineFormData.memberId}
              onChange={(e) =>
                setOnlineFormData({
                  ...onlineFormData,
                  memberId: e.target.value,
                })
              }
              className="input-field"
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.membershipType || "No plan"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Plan
            </label>
            <input
              type="text"
              value={onlineFormData.plan}
              readOnly
              className="input-field bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-80"
              placeholder="Auto-filled from member's plan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              value={onlineFormData.amount}
              readOnly
              className="input-field bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-80"
              placeholder="Auto-filled from plan"
            />
          </div>
          {selectedMemberForOnline && onlineFormData.amount && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
              Razorpay checkout will open for{" "}
              <span className="font-semibold">
                {selectedMemberForOnline.name}
              </span>{" "}
              — ₹{onlineFormData.amount}
            </div>
          )}
          <button
            onClick={handleOnlinePayment}
            disabled={
              paymentProcessing ||
              !onlineFormData.memberId ||
              !onlineFormData.amount
            }
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Smartphone className="h-5 w-5" />
            {paymentProcessing ? "Processing..." : "Pay with Razorpay"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Payment Details"
      >
        {selectedPayment && (
          <div className="space-y-3 text-sm">
            {[
              ["Member", selectedPayment.member],
              ["Plan", selectedPayment.plan],
              ["Amount", formatCurrency(selectedPayment.amount)],
              ["Date", formatDate(selectedPayment.paymentDate)],
              ["Status", selectedPayment.status],
              [
                "Method",
                selectedPayment.paymentMethod === "ONLINE"
                  ? "Online (Razorpay)"
                  : "Manual",
              ],
              ...(selectedPayment.razorpayPaymentId
                ? [["Payment ID", selectedPayment.razorpayPaymentId]]
                : []),
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {k}
                </span>
                <span className="text-gray-900 dark:text-white">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {isAdmin && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Payment"
        >
          <form onSubmit={handleEditPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Amount
              </label>
              <input
                type="number"
                value={editFormData.amount}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, amount: e.target.value })
                }
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Status
              </label>
              <select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, status: e.target.value })
                }
                className="input-field"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">
              Update Payment
            </button>
          </form>
        </Modal>
      )}

      {isAdmin && (
        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() =>
            setDeleteDialog({ open: false, id: null, memberName: "" })
          }
          onConfirm={handleDelete}
          title="Delete Payment"
          message={`Delete payment for ${deleteDialog.memberName}?`}
          confirmText="Delete"
        />
      )}
    </div>
  );
};

export default Payments;
