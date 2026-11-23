import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const usePreventBack = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    const handlePopState = (event) => {
      const currentPath = window.location.pathname;
      if (
        currentPath === "/login" ||
        currentPath === "/" ||
        currentPath === "/subscription"
      ) {
        navigate("/dashboard", { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAuthenticated, navigate]);
};
