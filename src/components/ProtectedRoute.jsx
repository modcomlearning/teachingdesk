import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/programs" replace />;

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="hamburger"
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
          <div className="mobile-logo">Teaching<span>Desk</span></div>
        </div>

        {children}
      </main>
    </div>
  );
}
