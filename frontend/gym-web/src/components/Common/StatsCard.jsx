import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const StatsCard = React.memo(
  ({ title, value, icon: Icon, color, change, changeLabel }) => {
    const isPositive = change >= 0;
    const changeColor = isPositive
      ? "text-green-600 dark:text-green-400"
      : "text-red-500 dark:text-red-400";

    const getColorName = (colorClass) => {
      if (!colorClass) return "blue";
      const match = colorClass.match(/text-([a-z]+)-\d+/);
      return match ? match[1] : "blue";
    };

    const colorName = getColorName(color);

    const getBgClass = () => {
      return `bg-${colorName}-100 dark:bg-${colorName}-900/30`;
    };

    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive ? (
                  <TrendingUp className={`h-4 w-4 ${changeColor}`} />
                ) : (
                  <TrendingDown className={`h-4 w-4 ${changeColor}`} />
                )}
                <span className={`text-sm font-medium ${changeColor}`}>
                  {Math.abs(change)}%
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  {changeLabel}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${getBgClass()}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </div>
    );
  },
);

StatsCard.displayName = "StatsCard";
export default StatsCard;
