import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Search, Dumbbell } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-100 rounded-full mb-6">
            <Search className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
            Please check the URL or navigate back to the dashboard.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full btn-secondary flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>

          <Link
            to="/dashboard"
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            Go to Dashboard
          </Link>

          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Dumbbell className="h-5 w-5" />
            Back to Home
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <button
              onClick={() => navigate("/dashboard")}
              className="text-primary-600 hover:underline"
            >
              Return to Dashboard
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
