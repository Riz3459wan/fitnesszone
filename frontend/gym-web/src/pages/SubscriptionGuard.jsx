import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscriptionAPI } from "../services/api";
import toast from "react-hot-toast";

const SubscriptionGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await subscriptionAPI.getStatus();
        const data = response.data.data;

        if (!data.isActive) {
          setIsActive(false);
          toast.error("Your free trial has expired. Please choose a plan.");
          navigate("/subscription");
        }
      } catch (error) {
        console.error("Subscription check failed", error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isActive ? children : null;
};

export default SubscriptionGuard;
