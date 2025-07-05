import React, { createContext, useContext, useState, useEffect } from "react";
import { projectsAPI } from "../api/client";

// Create the context
const ProjectContext = createContext();

// Custom hook to use the project context
export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
};

// Project Provider component
export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch projects function
  const fetchProjects = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("hubstaff_token") ||
        localStorage.getItem("authToken");
      if (!token) {
        console.warn("No authentication token found");
        return;
      }

      const response = await projectsAPI.getProjects();

      // Handle different response structures
      let projectsData = [];
      if (response.data && Array.isArray(response.data)) {
        projectsData = response.data;
      } else if (
        response.data &&
        response.data.projects &&
        Array.isArray(response.data.projects)
      ) {
        projectsData = response.data.projects;
      }

      setProjects(projectsData);

      // Fetch tasks for the first few projects
      if (projectsData.length > 0) {
        try {
          const tasksPromises = projectsData
            .slice(0, 5) // Fetch tasks for first 5 projects
            .map((project) =>
              projectsAPI
                .getProjectTasks(project.id)
                .catch(() => ({ data: [] }))
            );
          const tasksResponses = await Promise.all(tasksPromises);
          const allTasks = tasksResponses.flatMap(
            (response) => response.data || []
          );
          setTasks(allTasks);
        } catch (tasksError) {
          console.warn("Failed to fetch some tasks:", tasksError);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setError(error.message || "Failed to fetch projects");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Add a new project to the state
  const addProject = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  // Update a project in the state
  const updateProject = (projectId, updatedProject) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, ...updatedProject } : project
      )
    );
  };

  // Remove a project from the state
  const removeProject = (projectId) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setTasks((prev) => prev.filter((task) => task.project_id !== projectId));
  };

  // Add a new task to the state
  const addTask = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  // Update a task in the state
  const updateTask = (taskId, updatedTask) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updatedTask } : task
      )
    );
  };

  // Remove a task from the state
  const removeTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  // Refresh projects (useful for manual refresh)
  const refreshProjects = () => {
    fetchProjects(true);
  };

  // Get projects by status
  const getProjectsByStatus = (status) => {
    return projects.filter((project) => project.status === status);
  };

  // Get user's projects (for regular users)
  const getUserProjects = (userId) => {
    return projects.filter(
      (project) =>
        project.members.includes(userId) || project.manager === userId
    );
  };

  // Get project statistics
  const getProjectStats = () => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const paused = projects.filter((p) => p.status === "paused").length;
    const cancelled = projects.filter((p) => p.status === "cancelled").length;

    return {
      total,
      active,
      completed,
      paused,
      cancelled,
    };
  };

  // Initial load on mount
  useEffect(() => {
    const user = localStorage.getItem("hubstaff_user");
    if (user) {
      fetchProjects(true);
    }
  }, []);

  const value = {
    // State
    projects,
    tasks,
    loading,
    error,

    // Actions
    fetchProjects,
    addProject,
    updateProject,
    removeProject,
    addTask,
    updateTask,
    removeTask,
    refreshProjects,

    // Utilities
    getProjectsByStatus,
    getUserProjects,
    getProjectStats,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
