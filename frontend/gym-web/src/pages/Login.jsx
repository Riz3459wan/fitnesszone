import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePreventBack } from "../hooks/usePreventBack";
import toast from "react-hot-toast";
import { Dumbbell, LogIn, ArrowLeft, Building2, Shield } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { login, isAuthenticated, gym } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  usePreventBack();

  const subdomainParam = new URLSearchParams(location.search).get("gym");

  useEffect(() => {
    if (isAuthenticated && gym) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, gym, navigate]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (attempts >= 5) {
        toast.error("Too many attempts. Please wait 5 minutes.");
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        toast.error("Please enter your email and password");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }

      setLoading(true);
      try {
        const result = await login(trimmedEmail, trimmedPassword);
        if (result.success) {
          setAttempts(0);
          toast.success(`Welcome to ${result.gym?.name || "GymZora"}!`);
          navigate("/dashboard", { replace: true });
        } else {
          setAttempts((prev) => prev + 1);
          toast.error("Invalid email or password");
        }
      } catch (error) {
        setAttempts((prev) => prev + 1);
        const status = error.response?.status;

        if (status === 401) {
          toast.error("Invalid email or password");
        } else if (status === 403) {
          toast.error("Account is deactivated. Contact support.");
        } else if (status === 429) {
          toast.error("Too many attempts. Try again later.");
        } else {
          toast.error("Login failed. Please try again.");
          console.error("Login error:", error);
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, navigate, attempts],
  );

  if (isAuthenticated && gym) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="flex justify-center mb-8">
          <div className="bg-blue-100 p-4 rounded-full">
            <Dumbbell className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Sign In to {subdomainParam ? subdomainParam : "Your Gym"}
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Enter your email and password to continue
        </p>

        {attempts >= 3 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <Shield className="h-4 w-4 text-yellow-600" />
            <p className="text-xs text-yellow-700">
              {5 - attempts} attempts remaining before temporary lockout
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 bg-white text-gray-900 placeholder-gray-400"
              required
              disabled={loading}
              placeholder="you@example.com"
              autoFocus
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150 bg-white text-gray-900 placeholder-gray-400"
              required
              disabled={loading}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || attempts >= 5}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/subscription" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        {subdomainParam && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              <span>
                Logging into <strong>{subdomainParam}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
