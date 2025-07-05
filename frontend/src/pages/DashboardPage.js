import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { DashboardWidget } from "../components/DashboardWidget";
import { useProjects } from "../contexts/ProjectContext";
import { analyticsAPI, usersAPI } from "../api/client";

export const DashboardPage = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState({
    widgets: [],
    teamActivity: [],
  });
  const [loading, setLoading] = useState(true);

  // Use the projects context
  const { projects, getProjectStats, refreshProjects } = useProjects();

  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchDashboardData();
      await refreshProjects();
    };

    initializeDashboard();
  }, [refreshProjects]);

  // Update widgets when projects change
  useEffect(() => {
    if (projects.length >= 0) {
      updateWidgets();
    }
  }, [projects, user]);

  const updateWidgets = async () => {
    try {
      const projectStats = getProjectStats();

      // Get analytics data with error handling
      let analyticsData = { user_stats: { total_hours: 0, avg_activity: 0 } };
      try {
        const analyticsResponse = await analyticsAPI.getDashboardAnalytics();
        analyticsData = analyticsResponse.data;
      } catch (error) {
        console.warn("Failed to fetch analytics:", error);
      }

      const widgets = [
        {
          title: "Hours Worked",
          value: `${analyticsData.user_stats?.total_hours || 0}h`,
          subtitle: "This month",
          icon: "⏰",
          color: "blue",
        },
        {
          title: "Active Projects",
          value: projectStats.active,
          subtitle: "Currently running",
          icon: "📁",
          color: "green",
        },
        {
          title: "Total Projects",
          value: projectStats.total,
          subtitle: "All projects",
          icon: "📊",
          color: "purple",
        },
        {
          title: "Activity Level",
          value: `${Math.round(analyticsData.user_stats?.avg_activity || 0)}%`,
          subtitle: "This week",
          icon: "📈",
          color: "orange",
        },
      ];

      setDashboardData((prev) => ({
        ...prev,
        widgets,
      }));
    } catch (error) {
      console.error("Failed to update widgets:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch team activity
      const usersResponse = await usersAPI.getUsers({ limit: 10 });
      const users = usersResponse.data;

      setDashboardData((prev) => ({
        ...prev,
        teamActivity: users,
      }));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} currentPage="Dashboard" />
        <div className="flex">
          <Sidebar currentPage="Dashboard" />
          <main className="flex-1 ml-64 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} currentPage="Dashboard" />
      <div className="flex">
        <Sidebar currentPage="Dashboard" />

        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user.name}! Here's what's happening with your
                team today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {dashboardData.widgets.map((widget, index) => (
                <DashboardWidget key={index} {...widget} />
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Team Activity
                </h3>
                <div className="space-y-4">
                  {dashboardData.teamActivity.length > 0 ? (
                    dashboardData.teamActivity.slice(0, 4).map((teamUser) => (
                      <div
                        key={teamUser.id}
                        className="flex items-center space-x-3"
                      >
                        <img
                          src={
                            teamUser.avatar ||
                            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                          }
                          alt={teamUser.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">
                              {teamUser.name}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                teamUser.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {teamUser.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {teamUser.role}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No team members found</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Projects
                </h3>
                <div className="space-y-4">
                  {projects.length > 0 ? (
                    projects.slice(0, 4).map((project) => (
                      <div
                        key={project.id}
                        className="border-l-4 border-blue-500 pl-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {project.name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              project.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {project.client}
                        </p>
                        <p className="text-sm text-gray-600">
                          ${project.budget || 0} budget
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No projects yet</p>
                      {(user?.role === "admin" || user?.role === "manager") && (
                        <p className="text-sm text-gray-400 mt-1">
                          Create your first project to get started
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
