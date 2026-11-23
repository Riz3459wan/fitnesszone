import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Dumbbell, ArrowRight, Gift } from "lucide-react";
import { useRazorpay } from "../hooks/useRazorpay";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const { paySubscription } = useRazorpay();
  const { gym, user } = useAuth();
  const [processingPlanId, setProcessingPlanId] = useState(null);

  const plans = [
    {
      id: "free",
      name: "Free Trial",
      price: 0,
      period: "14 days",
      features: [
        "Up to 50 members",
        "Basic attendance tracking",
        "Payment management",
        "Email support",
        "Basic reports",
        "1 Trainer account",
        "No credit card required",
      ],
      highlighted: false,
      isTrial: true,
    },
    {
      id: "starter",
      name: "Starter",
      price: 49,
      period: "month",
      features: [
        "Up to 100 members",
        "Basic attendance tracking",
        "Payment management",
        "Email support",
        "Basic reports",
        "1 Trainer account",
      ],
      highlighted: false,
      isTrial: false,
    },
    {
      id: "professional",
      name: "Professional",
      price: 99,
      period: "month",
      features: [
        "Unlimited members",
        "Advanced attendance analytics",
        "Automated payment reminders",
        "Priority support",
        "Advanced reports & export",
        "Multiple membership plans",
        "Up to 5 Trainer accounts",
      ],
      highlighted: true,
      isTrial: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 199,
      period: "month",
      features: [
        "Everything in Professional",
        "Unlimited trainer accounts",
        "Custom features development",
        "Dedicated account manager",
        "API access",
        "SLA guarantee",
        "On-premise deployment option",
      ],
      highlighted: false,
      isTrial: false,
    },
  ];

  const handleSelectPlan = useCallback(
    async (plan) => {
      if (plan.isTrial) {
        localStorage.setItem("selectedPlan", JSON.stringify(plan));
        navigate("/register");
        return;
      }

      if (!user) {
        localStorage.setItem("selectedPlan", JSON.stringify(plan));
        navigate("/register");
        return;
      }

      setProcessingPlanId(plan.id);

      await paySubscription({
        planId: plan.id,
        planName: plan.name,
        amount: plan.price * 100,
        gymName: gym?.name || "",
        email: user?.email || "",
        onSuccess: () => {
          setProcessingPlanId(null);
          toast.success(`${plan.name} plan activated!`);
          navigate("/dashboard");
        },
        onFailure: () => {
          setProcessingPlanId(null);
        },
      });
    },
    [navigate, paySubscription, gym, user],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Dumbbell className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with 14-day free trial, then choose the perfect plan for your
            gym.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 transition-all relative ${
                plan.highlighted
                  ? "bg-primary-600 text-white shadow-xl scale-105 md:scale-100"
                  : plan.isTrial
                    ? "bg-green-50 border-2 border-green-500 shadow-sm hover:shadow-lg"
                    : "bg-white border border-gray-200 shadow-sm hover:shadow-lg"
              }`}
            >
              {plan.isTrial && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    14 DAYS FREE
                  </span>
                </div>
              )}
              <div className="flex items-center justify-center mb-4">
                {plan.isTrial ? (
                  <Gift className="h-10 w-10 text-green-500" />
                ) : (
                  <Dumbbell
                    className={`h-10 w-10 ${plan.highlighted ? "text-white" : "text-primary-600"}`}
                  />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">
                {plan.name}
              </h3>
              <div className="text-center mb-4">
                {plan.price === 0 ? (
                  <>
                    <span className="text-3xl font-bold">Free</span>
                    <span className="text-sm"> for {plan.period}</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold">₹{plan.price}</span>
                    <span className="text-sm">/{plan.period}</span>
                  </>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 5).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle
                      className={`h-4 w-4 flex-shrink-0 ${
                        plan.highlighted
                          ? "text-white"
                          : plan.isTrial
                            ? "text-green-500"
                            : "text-primary-600"
                      }`}
                    />
                    <span
                      className={
                        plan.highlighted ? "text-white" : "text-gray-600"
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={processingPlanId === plan.id}
                className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.highlighted
                    ? "bg-white text-primary-600 hover:bg-gray-100"
                    : plan.isTrial
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
              >
                {processingPlanId === plan.id ? (
                  "Processing..."
                ) : plan.isTrial ? (
                  <>
                    Start Free Trial <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Select Plan <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <p className="text-gray-500">
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

export default SubscriptionPlans;
