import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RevenueChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
