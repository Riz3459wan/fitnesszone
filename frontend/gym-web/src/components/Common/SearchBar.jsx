import React, { useState, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";

const SearchBar = React.memo(
  ({ onSearch, placeholder = "Search...", className = "", delay = 500 }) => {
    const [value, setValue] = useState("");
    const debouncedValue = useDebounce(value, delay);

    useEffect(() => {
      onSearch(debouncedValue);
    }, [debouncedValue, onSearch]);

    const handleClear = useCallback(() => {
      setValue("");
      onSearch("");
    }, [onSearch]);

    const handleChange = useCallback((e) => {
      setValue(e.target.value);
    }, []);

    return (
      <form
        onSubmit={(e) => e.preventDefault()}
        className={`relative ${className}`}
      >
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
          </button>
        )}
      </form>
    );
  },
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
