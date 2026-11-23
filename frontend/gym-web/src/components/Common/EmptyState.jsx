import React from "react";
import { Package } from "lucide-react";

const EmptyState = React.memo(({ title, message, icon: Icon, action }) => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 transition-colors duration-200">
        {Icon ? (
          <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        ) : (
          <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{message}</p>
      {action && action}
    </div>
  );
});

EmptyState.displayName = "EmptyState";

export default EmptyState;
