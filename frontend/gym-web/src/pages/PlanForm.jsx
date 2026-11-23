import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { planAPI } from "../services/api";
import { Save, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const PlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "Monthly",
    features: "",
  });

  const fetchPlan = useCallback(async () => {
    if (!id) return;
    setFetching(true);
    try {
      const response = await planAPI.getById(id);
      const plan = response.data.data;
      setFormData({
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        features: plan.features || "",
      });
    } catch (error) {
      toast.error("Failed to load plan");
      navigate("/plans", { replace: true });
    } finally {
      setFetching(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) fetchPlan();
  }, [id, fetchPlan]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (id) {
          await planAPI.update(id, formData);
          toast.success("Plan updated successfully");
        } else {
          await planAPI.create(formData);
          toast.success("Plan created successfully");
        }
        navigate("/plans");
      } catch (error) {
        toast.error(id ? "Failed to update plan" : "Failed to create plan");
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
          onClick={() => navigate("/plans")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {id ? "Edit Plan" : "Add New Plan"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {id
              ? "Update membership plan details"
              : "Create a new membership plan"}
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plan Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="input-field"
              placeholder="e.g., Premium, Basic, Pro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              disabled={loading}
              className="input-field"
              placeholder="Enter price"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration *
            </label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              disabled={loading}
              className="input-field"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Features (comma separated)
            </label>
            <textarea
              name="features"
              value={formData.features}
              onChange={handleChange}
              rows="3"
              disabled={loading}
              className="input-field"
              placeholder="e.g., Gym Access, Locker Room, Group Classes"
            />
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
              {id ? "Update Plan" : "Create Plan"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/plans")}
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

export default PlanForm;
