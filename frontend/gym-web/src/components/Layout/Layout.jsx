import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import ErrorBoundary from "../Common/ErrorBoundary";
import { useSettings } from "../../context/SettingsContext";

const Layout = () => {
  const { appearance } = useSettings();
  const compact = appearance?.compactView;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Header />
      <main className={compact ? "p-3" : "p-6"}>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default Layout;
