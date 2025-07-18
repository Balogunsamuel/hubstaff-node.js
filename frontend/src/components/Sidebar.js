import React from "react";
import { Link } from "react-router-dom";

export const Sidebar = ({ currentPage }) => {
  const menuItems = [
    { name: "Dashboard", icon: "📊", path: "/dashboard" },
    { name: "Time Tracking", icon: "⏰", path: "/time-tracking" },
    { name: "Team", icon: "👥", path: "/team" },
    { name: "Projects", icon: "📁", path: "/projects" },
    { name: "Reports", icon: "📈", path: "/reports" },
    { name: "Integrations", icon: "🔗", path: "/integrations" },
    { name: "Settings", icon: "⚙️", path: "/settings" },
  ];

  return (
    <div className="w-64 bg-white shadow-sm h-screen fixed left-0 top-16 border-r border-gray-200">
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                currentPage === item.name
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
