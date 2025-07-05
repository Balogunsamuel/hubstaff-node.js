// Frontend API utility - Token handling
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8001";

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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 errors by clearing token
    if (response.status === 401) {
      removeToken();
      // Optionally redirect to login
      // window.location.href = '/login';
      throw new Error("Authentication failed");
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login failed");
    }

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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Registration failed");
    }

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

// Get users function
const getUsers = async (limit = 10) => {
  try {
    const response = await apiCall(`/api/users?limit=${limit}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch users");
    }

    return await response.json();
  } catch (error) {
    console.error("Get users error:", error);
    throw error;
  }
};

// Get projects function
const getProjects = async (limit = 5) => {
  try {
    const response = await apiCall(`/api/projects?limit=${limit}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch projects");
    }

    return await response.json();
  } catch (error) {
    console.error("Get projects error:", error);
    throw error;
  }
};

// Get analytics dashboard
const getDashboard = async () => {
  try {
    const response = await apiCall("/api/analytics/dashboard");

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch dashboard");
    }

    return await response.json();
  } catch (error) {
    console.error("Get dashboard error:", error);
    throw error;
  }
};

// Logout function
const logout = () => {
  removeToken();
  // Optionally redirect to login
  // window.location.href = '/login';
};

// Check if user is authenticated
const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// Export all functions
export {
  login,
  register,
  getUsers,
  getProjects,
  getDashboard,
  logout,
  isAuthenticated,
  getToken,
  setToken,
  removeToken,
  apiCall,
};
