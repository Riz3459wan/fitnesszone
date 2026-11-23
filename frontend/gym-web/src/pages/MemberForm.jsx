import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { memberAPI, planAPI } from "../services/api";
import { Save, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

const MemberForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    membershipType: "",
  });

  const fetchPlans = useCallback(async () => {
    try {
      const response = await planAPI.getAll();
      setPlans(response.data.data);
    } catch (error) {
      console.error("Failed to fetch plans", error);
      toast.error("Failed to load membership plans");
    }
  }, []);

  const fetchMember = useCallback(async () => {
    if (!id) return;
    setFetching(true);
    try {
      const response = await memberAPI.getById(id);
      const member = response.data.data;
      setFormData({
        name: member.name,
        email: member.email,
        phone: member.phone,
        membershipType: member.membershipType || "",
      });
    } catch (error) {
      toast.error("Failed to load member");
      navigate("/members", { replace: true });
    } finally {
      setFetching(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPlans();
    if (id) fetchMember();
  }, [id, fetchPlans, fetchMember]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    return true;
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      setLoading(true);
      try {
        if (id) {
          await memberAPI.update(id, formData);
          toast.success("Member updated successfully");
        } else {
          await memberAPI.create(formData);
          toast.success("Member created successfully");
        }
        window.dispatchEvent(new CustomEvent("notification-read"));
        navigate("/members");
      } catch (error) {
        const message =
          error.response?.data?.message ||
          (id ? "Failed to update member" : "Failed to create member");
        toast.error(message);
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
          onClick={() => navigate("/members")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-990">
            {id ? "Edit Member" : "Add New Member"}
          </h1>
          <p className="text-gray-500 mt-1">
            {id ? "Update member information" : "Enter member details to add"}
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="input-field"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={loading}
              className="input-field"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Membership Type *
            </label>
            <select
              name="membershipType"
              value={formData.membershipType}
              onChange={handleChange}
              required
              disabled={loading}
              className="input-field"
            >
              <option value="">Select membership type</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.name}>
                  {plan.name} - ₹{plan.price}/{plan.duration}
                </option>
              ))}
            </select>
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
              {id ? "Update Member" : "Create Member"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/members")}
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

export default MemberForm;
