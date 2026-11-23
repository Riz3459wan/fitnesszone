import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { planAPI } from "../services/api";
import { Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../components/Common/ConfirmDialog";
import EmptyState from "../components/Common/EmptyState";
import Loader from "../components/Common/Loader";
import Pagination from "../components/Common/Pagination";

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const navigate = useNavigate();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await planAPI.getAll();
      setPlans(response.data.data);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDelete = useCallback(async () => {
    try {
      await planAPI.delete(deleteDialog.id);
      toast.success("Plan deleted");
      await fetchPlans();
    } catch (error) {
      toast.error("Failed to delete plan");
    } finally {
      setDeleteDialog({ open: false, id: null, name: "" });
    }
  }, [deleteDialog.id, fetchPlans]);

  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return plans.slice(start, start + itemsPerPage);
  }, [plans, currentPage]);

  const totalPages = Math.ceil(plans.length / itemsPerPage);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Membership Plans</h1>
          <p className="page-subtitle">Manage plans and pricing</p>
        </div>
        <button
          onClick={() => navigate("/plans/new")}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Add Plan
        </button>
      </div>
      {plans.length === 0 ? (
        <EmptyState
          title="No plans found"
          message="Create your first membership plan."
          action={
            <button
              onClick={() => navigate("/plans/new")}
              className="btn-primary"
            >
              Add Plan
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPlans.map((plan) => (
              <div
                key={plan.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/plans/edit/${plan.id}`)}
                      className="p-1 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          id: plan.id,
                          name: plan.name,
                        })
                      }
                      className="p-1 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    ₹{plan.price}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    per {plan.duration?.toLowerCase()}
                  </p>
                </div>
                <div className="space-y-2 mb-4">
                  {plan.features?.split(",").map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                      <span>{f.trim()}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button className="w-full btn-primary">Select Plan</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, name: "" })}
        onConfirm={handleDelete}
        title="Delete Plan"
        message={`Delete "${deleteDialog.name}" plan?`}
        confirmText="Delete"
      />
    </div>
  );
};

export default Plans;
