import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";

const Alert = React.memo(({ type = "info", message, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success:
      "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
    error:
      "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
    warning:
      "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300",
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
  };

  const Icon = icons[type] || Info;
  const colorClass = colors[type] || colors.info;

  return (
    <div
      className={`rounded-lg border p-4 mb-4 relative ${colorClass} transition-colors duration-200`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm flex-1">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});

Alert.displayName = "Alert";

export default Alert;
