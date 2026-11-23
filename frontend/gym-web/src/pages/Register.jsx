import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import { Dumbbell, UserPlus, ArrowLeft, Building2, Globe } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    fullName: "",
    phone: "",
    gymName: "",
    subdomain: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState(true);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const debouncedSubdomain = useDebounce(formData.subdomain, 500);

  useEffect(() => {
    const plan = localStorage.getItem("selectedPlan");
    if (!plan) navigate("/subscription");
    else setSelectedPlan(JSON.parse(plan));
  }, [navigate]);

  useEffect(() => {
    if (!debouncedSubdomain || debouncedSubdomain.length < 3) {
      setSubdomainAvailable(false);
      return;
    }
    const checkAvailability = async () => {
      setCheckingSubdomain(true);
      try {
        const response = await authAPI.checkSubdomain(debouncedSubdomain);
        const available =
          response.data?.success && response.data?.data?.available === true;
        setSubdomainAvailable(available);
      } catch (error) {
        setSubdomainAvailable(false);
        toast.error("Could not verify subdomain. Please try again.");
      } finally {
        setCheckingSubdomain(false);
      }
    };
    checkAvailability();
  }, [debouncedSubdomain]);

  const handleChange = useCallback((e) => {
    let { name, value } = e.target;
    if (name === "subdomain") {
      value = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const generateSubdomain = useCallback(() => {
    const generated = formData.gymName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, subdomain: generated }));
  }, [formData.gymName]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (!subdomainAvailable) {
        toast.error("Subdomain is not available. Please choose another one.");
        return;
      }
      setLoading(true);
      try {
        const registrationData = {
          username: formData.username,
          password: formData.password,
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          gymName: formData.gymName,
          subdomain: formData.subdomain,
          planId: Number(selectedPlan?.id),
          planName: selectedPlan?.name,
        };
        const result = await register(registrationData);
        if (result.success) {
          toast.success(`Gym "${formData.gymName}" created successfully!`);
          toast.success(`Your gym subdomain: ${result.subdomain}.GymZora.com`);
          localStorage.removeItem("selectedPlan");
          navigate(`/login?gym=${result.subdomain}`);
        } else {
          toast.error(
            result.message || "Registration failed. Please try again.",
          );
        }
      } catch (error) {
        toast.error("Something went wrong. Please try again.");
        console.error("Registration error:", error);
      } finally {
        setLoading(false);
      }
    },
    [formData, subdomainAvailable, selectedPlan, register, navigate],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <button
          onClick={() => navigate("/subscription")}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Plans
        </button>
        <div className="flex justify-center mb-8">
          <div className="bg-primary-100 p-4 rounded-full">
            <Dumbbell className="h-12 w-12 text-primary-600" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Create Your Gym
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {selectedPlan && (
            <span className="text-primary-600 font-semibold">
              {selectedPlan.name} Plan - ₹{selectedPlan.price}/
              {selectedPlan.duration?.toLowerCase() || "month"}
            </span>
          )}
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gym Name *
              </label>
              <input
                type="text"
                name="gymName"
                value={formData.gymName}
                onChange={handleChange}
                required
                disabled={loading}
                className="input-field"
                placeholder="Enter your gym name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subdomain *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`input-field flex-1 ${
                    !subdomainAvailable && formData.subdomain
                      ? "border-red-500"
                      : ""
                  }`}
                  placeholder="your-gym"
                />
                <button
                  type="button"
                  onClick={generateSubdomain}
                  disabled={loading}
                  className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  <Globe className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {formData.subdomain && (
                <p
                  className={`text-sm mt-1 ${
                    subdomainAvailable ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {checkingSubdomain
                    ? "Checking..."
                    : subdomainAvailable
                      ? `${formData.subdomain}.GymZora.com is available`
                      : "Subdomain not available"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={loading}
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="input-field"
                placeholder="admin@gym.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className="input-field"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                className="input-field"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="input-field"
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className="input-field"
                placeholder="Confirm your password"
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              <span>Your gym will be accessible at:</span>
              <strong className="text-primary-600">
                {formData.subdomain
                  ? `${formData.subdomain}.GymZora.com`
                  : "your-gym.GymZora.com"}
              </strong>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !subdomainAvailable}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <UserPlus className="h-5 w-5" /> Create Gym Account
              </>
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary-600 hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
