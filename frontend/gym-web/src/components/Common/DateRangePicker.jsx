import React from "react";
import { Calendar } from "lucide-react";

const DateRangePicker = React.memo(
  ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
    return (
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200"
          />
        </div>
        <span className="text-gray-500 dark:text-gray-400 self-center">to</span>
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200"
          />
        </div>
      </div>
    );
  },
);

DateRangePicker.displayName = "DateRangePicker";

export default DateRangePicker;
