import React from "react";

const Loader = React.memo(() => {
  return (
    <div className="fixed inset-0 bg-white/75 dark:bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 transition-colors duration-200">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 dark:border-primary-400"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900/50 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
});

Loader.displayName = "Loader";

export default Loader;
