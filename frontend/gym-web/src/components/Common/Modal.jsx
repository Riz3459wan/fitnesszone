import React from "react";
import { X } from "lucide-react";

const Modal = React.memo(
  ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;

    const sizes = {
      sm: "max-w-md",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "max-w-6xl",
    };

    return (
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 transition-colors duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200`}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  },
);

Modal.displayName = "Modal";

export default Modal;
