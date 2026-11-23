import React from "react";
import { AlertTriangle, X } from "lucide-react";

const ConfirmDialog = React.memo(
  ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
  }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 transition-colors duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onConfirm} className="btn-danger flex-1">
              {confirmText}
            </button>
            <button onClick={onClose} className="btn-secondary flex-1">
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

ConfirmDialog.displayName = "ConfirmDialog";

export default ConfirmDialog;
