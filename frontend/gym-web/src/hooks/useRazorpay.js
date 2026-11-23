import { useCallback } from "react";
import { razorpayAPI } from "../services/api";
import toast from "react-hot-toast";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const useRazorpay = () => {
  const pay = useCallback(
    async ({
      amount,
      description,
      prefillName,
      prefillEmail,
      prefillPhone,
      onSuccess,
      onFailure,
    }) => {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Payment SDK failed to load. Please try again.");
        return;
      }

      try {
        const { data } = await razorpayAPI.createOrder({
          amount,
          currency: "INR",
        });
        const order = data.data;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          order_id: order.id,
          name: "GymZora",
          description,
          prefill: {
            name: prefillName || "",
            email: prefillEmail || "",
            contact: prefillPhone || "",
          },
          theme: { color: "#2563eb" },
          handler: async (response) => {
            try {
              await razorpayAPI.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success("Payment successful!");
              onSuccess?.(response);
            } catch {
              toast.error("Payment verification failed. Contact support.");
              onFailure?.();
            }
          },
          modal: {
            ondismiss: () => {
              toast("Payment cancelled.", { icon: "ℹ️" });
              onFailure?.();
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => {
          toast.error("Payment failed. Please try again.");
          onFailure?.();
        });
        rzp.open();
      } catch {
        toast.error("Could not initiate payment. Please try again.");
        onFailure?.();
      }
    },
    [],
  );

  const paySubscription = useCallback(
    async ({
      planId,
      planName,
      amount,
      gymName,
      email,
      onSuccess,
      onFailure,
    }) => {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Payment SDK failed to load. Please try again.");
        return;
      }

      try {
        const { data } = await razorpayAPI.createSubscriptionOrder({
          planId,
          planName,
        });
        const order = data.data;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          order_id: order.id,
          name: "GymZora",
          description: `${planName} Subscription`,
          prefill: {
            name: gymName || "",
            email: email || "",
          },
          theme: { color: "#2563eb" },
          notes: {
            plan_id: planId,
            plan_name: planName,
          },
          handler: async (response) => {
            try {
              await razorpayAPI.verifySubscription({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: planId,
                plan_name: planName,
              });
              toast.success(`${planName} plan activated!`);
              onSuccess?.(response);
            } catch {
              toast.error("Payment verification failed. Contact support.");
              onFailure?.();
            }
          },
          modal: {
            ondismiss: () => {
              toast("Payment cancelled.", { icon: "ℹ️" });
              onFailure?.();
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => {
          toast.error("Payment failed. Please try again.");
          onFailure?.();
        });
        rzp.open();
      } catch {
        toast.error("Could not initiate payment. Please try again.");
        onFailure?.();
      }
    },
    [],
  );

  return { pay, paySubscription };
};
