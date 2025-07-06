// Frontend API utility - Token handling
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://hubstaff-node-js-1.onrender.com";

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem("authToken") || localStorage.getItem("token");
};

// Set token in localStorage
const setToken = (token) => {
  localStorage.setItem("authToken", token);
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("hubstaff_token");
  localStorage.removeItem("hubstaff_user");
};

// API call helper with proper token handling
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if token exists
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Making API call to: ${url}`); // Debug log

    const response = await fetch(url, config);

    // Handle 401 errors by clearing token
    if (response.status === 401) {
      removeToken();
      throw new Error("Authentication failed. Please login again.");
    }

    // Handle 404 errors
    if (response.status === 404) {
      throw new Error("Route not found");
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response;
  } catch (error) {
    console.error("API call error:", error);
    throw error;
  }
};

// Login function
const login = async (credentials) => {
  try {
    const response = await apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    // Store the token properly
    if (data.token) {
      setToken(data.token);
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Register function
const register = async (userData) => {
  try {
    const response = await apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    // Store the token properly
    if (data.token) {
      setToken(data.token);
    }

    return data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Get current user profile
const getCurrentUser = async () => {
  try {
    const response = await apiCall("/api/auth/me");
    return await response.json();
  } catch (error) {
    console.error("Get current user error:", error);
    throw error;
  }
};

// Change password
const changePassword = async (passwordData) => {
  try {
    const response = await apiCall("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
    return await response.json();
  } catch (error) {
    console.error("Change password error:", error);
    throw error;
  }
};

// Update user settings
const updateSettings = async (settings) => {
  try {
    const response = await apiCall("/api/auth/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    return await response.json();
  } catch (error) {
    console.error("Update settings error:", error);
    throw error;
  }
};

// Refresh token
const refreshToken = async () => {
  try {
    const response = await apiCall("/api/auth/refresh", {
      method: "POST",
    });
    const data = await response.json();

    if (data.token) {
      setToken(data.token);
    }

    return data;
  } catch (error) {
    console.error("Refresh token error:", error);
    throw error;
  }
};

// Forgot password
const forgotPassword = async (email) => {
  try {
    const response = await apiCall("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (error) {
    console.error("Forgot password error:", error);
    throw error;
  }
};

// Reset password
const resetPassword = async (resetData) => {
  try {
    const response = await apiCall("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(resetData),
    });
    return await response.json();
  } catch (error) {
    console.error("Reset password error:", error);
    throw error;
  }
};

// Get users function
const getUsers = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/users${queryString ? `?${queryString}` : ""}`;

    const response = await apiCall(endpoint);
    return await response.json();
  } catch (error) {
    console.error("Get users error:", error);
    throw error;
  }
};

// Get projects function
const getProjects = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/projects${queryString ? `?${queryString}` : ""}`;

    const response = await apiCall(endpoint);
    return await response.json();
  } catch (error) {
    console.error("Get projects error:", error);
    throw error;
  }
};

// Create project
const createProject = async (projectData) => {
  try {
    const response = await apiCall("/api/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
    return await response.json();
  } catch (error) {
    console.error("Create project error:", error);
    throw error;
  }
};

// Update project
const updateProject = async (projectId, projectData) => {
  try {
    const response = await apiCall(`/api/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(projectData),
    });
    return await response.json();
  } catch (error) {
    console.error("Update project error:", error);
    throw error;
  }
};

// Delete project
const deleteProject = async (projectId) => {
  try {
    const response = await apiCall(`/api/projects/${projectId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Delete project error:", error);
    throw error;
  }
};

// Get project statistics
const getProjectStats = async () => {
  try {
    const response = await apiCall("/api/projects/stats/dashboard");
    return await response.json();
  } catch (error) {
    console.error("Get project stats error:", error);
    throw error;
  }
};

// Get analytics dashboard
const getDashboard = async () => {
  try {
    const response = await apiCall("/api/analytics/dashboard");
    return await response.json();
  } catch (error) {
    console.error("Get dashboard error:", error);
    throw error;
  }
};

// Get team stats
const getTeamStats = async () => {
  try {
    const response = await apiCall("/api/users/team/stats");
    return await response.json();
  } catch (error) {
    console.error("Get team stats error:", error);
    throw error;
  }
};

// Logout function
const logout = () => {
  removeToken();
  // Clear all auth-related data
  localStorage.removeItem("hubstaff_user");
  // Optionally redirect to login
  // window.location.href = '/login';
};

// Check if user is authenticated
const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// Verify token with backend
const verifyToken = async () => {
  try {
    const response = await apiCall("/api/auth/verify");
    return await response.json();
  } catch (error) {
    console.error("Token verification error:", error);
    return { valid: false };
  }
};

// Export all functions
export {
  // Auth functions
  login,
  register,
  getCurrentUser,
  changePassword,
  updateSettings,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  isAuthenticated,
  verifyToken,

  // User functions
  getUsers,
  getTeamStats,

  // Project functions
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,

  // Analytics functions
  getDashboard,

  // Utility functions
  getToken,
  setToken,
  removeToken,
  apiCall,
};
