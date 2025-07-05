import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Timer } from "../components/Timer";
import { useProjects } from "../contexts";
import { timeTrackingAPI } from "../api/client";

export const TimeTrackingPage = ({ user, onLogout }) => {
  const [activeEntry, setActiveEntry] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [loading, setLoading] = useState(true);

  // Use the projects context
  const { projects, refreshProjects } = useProjects();

  useEffect(() => {
    fetchData();
    // Refresh projects when component loads
    refreshProjects();
  }, []);

  const fetchData = async () => {
    try {
      const activeResponse = await timeTrackingAPI.getActiveEntry();
      setActiveEntry(activeResponse.data);
    } catch (error) {
      console.error("Failed to fetch time tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    try {
      const response = await timeTrackingAPI.startTracking({
        project_id: selectedProject,
        task_id: selectedTask || null,
        description: "Working on project",
      });
      setActiveEntry(response.data);
    } catch (error) {
      console.error("Failed to start tracking:", error);
    }
  };

  const handleStop = async (entryId) => {
    try {
      await timeTrackingAPI.stopTracking(entryId);
      setActiveEntry(null);
    } catch (error) {
      console.error("Failed to stop tracking:", error);
    }
  };

  const handleReset = () => {
    // Reset local state only
    setSelectedProject("");
    setSelectedTask("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={onLogout} currentPage="Time Tracking" />
        <div className="flex">
          <Sidebar currentPage="Time Tracking" />
          <main className="flex-1 ml-64 p-8">
            <div className="flex items-center justify-center h-64">
              <div className="spinner"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} currentPage="Time Tracking" />
      <div className="flex">
        <Sidebar currentPage="Time Tracking" />

        <main className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Time Tracking
              </h1>
              <p className="text-gray-600 mt-2">
                Track your time and manage your tasks efficiently.
              </p>
            </div>

            {/* Timer Section */}
            <div className="mb-8">
              <Timer
                activeEntry={activeEntry}
                onStart={handleStart}
                onStop={handleStop}
                onReset={handleReset}
              />
            </div>

            {/* Project and Task Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What are you working on?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task
                  </label>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a task (optional)</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Activity Monitor */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Activity Monitor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">📸</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Screenshots</h4>
                  <p className="text-sm text-gray-500">Every 10 minutes</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🖱️</span>
                  </div>
                  <h4 className="font-medium text-gray-900">Mouse Activity</h4>
                  <p className="text-sm text-gray-500">85% active</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">⌨️</span>
                  </div>
                  <h4 className="font-medium text-gray-900">
                    Keyboard Activity
                  </h4>
                  <p className="text-sm text-gray-500">78% active</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
