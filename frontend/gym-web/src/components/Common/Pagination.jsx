import React, { useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = React.memo(({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  const handlePrev = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

  const handlePageClick = useCallback(
    (page) => {
      if (typeof page === "number") onPageChange(page);
    },
    [onPageChange],
  );

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {getPageNumbers.map((page, idx) => (
        <button
          key={idx}
          onClick={() => handlePageClick(page)}
          className={`px-3 py-1 rounded-lg transition-colors ${
            page === currentPage
              ? "bg-primary-600 dark:bg-primary-500 text-white"
              : page === "..."
                ? "text-gray-500 dark:text-gray-400 cursor-default"
                : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
          disabled={page === "..."}
          aria-label={
            page === currentPage
              ? `Page ${page}, current`
              : `Go to page ${page}`
          }
        >
          {page}
        </button>
      ))}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
});

Pagination.displayName = "Pagination";

export default Pagination;
