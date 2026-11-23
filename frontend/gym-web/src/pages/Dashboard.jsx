import React, { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "../services/api";
import { useSettings } from "../context/SettingsContext";
import StatsCard from "../components/Common/StatsCard";
import RevenueChart from "../components/Charts/RevenueChart";
import ErrorBoundary from "../components/Common/ErrorBoundary";
import Loader from "../components/Common/Loader";
import { Users, IndianRupee, CalendarCheck, Award, Clock } from "lucide-react";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { formatCurrency, formatDate, gymName } = useSettings();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setError(null);
    try {
      const [statsRes, revenueRes, activitiesRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRevenue(),
        dashboardAPI.getRecentActivities(),
      ]);
      setStats(statsRes.data.data);
      setRevenueData(revenueRes.data.data);
      setActivities(activitiesRes.data.data);
    } catch {
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="card text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={fetchDashboardData} className="mt-4 btn-primary">
          Retry
        </button>
      </div>
    );

  const statCards = [
    {
      title: "Total Members",
      value: stats?.totalMembers || 0,
      icon: Users,
      color: "text-blue-600",
      change: stats?.membersChange || 0,
      changeLabel: "vs last month",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats?.monthlyRevenue || 0),
      icon: IndianRupee,
      color: "text-green-600",
      change: stats?.revenueChange || 0,
      changeLabel: "vs last month",
    },
    {
      title: "Today's Attendance",
      value: stats?.todayAttendance || 0,
      icon: CalendarCheck,
      color: "text-purple-600",
      change: stats?.attendanceChange || 0,
      changeLabel: "vs yesterday",
    },
    {
      title: "Active Memberships",
      value: stats?.activeMemberships || 0,
      icon: Award,
      color: "text-orange-600",
      change: stats?.activeChange || 0,
      changeLabel: "vs last month",
    },
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {gymName ? `Welcome to ${gymName}` : "Welcome back!"} Here's what's
            happening today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, idx) => (
            <StatsCard key={idx} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue Overview
            </h3>
            <RevenueChart data={revenueData} />
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activities
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activities?.length ? (
                activities.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                  >
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {act.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatDate(act.time) || act.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
                  No recent activities
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
