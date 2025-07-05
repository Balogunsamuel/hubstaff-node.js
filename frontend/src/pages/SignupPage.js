import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../utils/api";

export const SignupPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    role: "user", // Default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the new register function from our API utility
      const response = await register(formData);

      // The response structure from your backend is: { message, user, token }
      const { token, user } = response;

      // Store token using the correct key that matches your backend
      localStorage.setItem("hubstaff_token", token);
      localStorage.setItem("authToken", token); // Also store with the key our API utility expects
      localStorage.setItem("hubstaff_user", JSON.stringify(user));

      // Call the onLogin callback
      onLogin(user);

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      // Handle different types of errors
      console.error("Registration error:", error);

      let errorMessage = "Registration failed. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors) {
        // Handle validation errors array from express-validator
        const errors = error.response.data.errors;
        errorMessage = errors.map((err) => err.msg).join(", ");
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "user",
      label: "Team Member",
      description: "Regular user with basic access",
    },
    {
      value: "manager",
      label: "Project Manager",
      description: "Can create and manage projects",
    },
    {
      value: "admin",
      label: "Administrator",
      description: "Full access to all features",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-2xl font-bold text-white">Hubworker</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-white"
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white"
            >
              Work email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-white"
            >
              Company name
            </label>
            <input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-white mb-2"
            >
              Account Type
            </label>
            <div className="space-y-3">
              {roleOptions.map((option) => (
                <div
                  key={option.value}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    formData.role === option.value
                      ? "border-blue-400 bg-blue-50/10 backdrop-blur-sm"
                      : "border-gray-300 bg-white/5 backdrop-blur-sm hover:border-blue-300"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, role: option.value })
                  }
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      id={option.value}
                      name="role"
                      value={option.value}
                      checked={formData.role === option.value}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="mt-1 mr-3 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={option.value}
                        className="block text-sm font-medium text-white cursor-pointer"
                      >
                        {option.label}
                      </label>
                      <p className="text-xs text-blue-200 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-blue-100">
              Password must be at least 6 characters long
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Start free trial"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-blue-100">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-white font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
