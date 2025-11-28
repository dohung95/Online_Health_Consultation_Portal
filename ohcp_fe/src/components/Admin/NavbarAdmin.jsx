import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Admin.css";

export default function NavbarAdmin({ sidebarCollapsed, onToggleSidebar, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      localStorage.setItem('isLoggingOut', 'true');
      navigate("/");
      setTimeout(async () => {
        await logout();
        localStorage.removeItem('isLoggingOut');
      }, 100);
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem('isLoggingOut');
    }
  };

  const menuItems = [
    { icon: "bi-speedometer2", label: "Dashboard", path: "/admin" },
    { icon: "bi-people", label: "Patients", path: "/admin/patients" },
    { icon: "bi-calendar-check", label: "Appointments", path: "/admin/appointments" },
    { icon: "bi-file-medical", label: "Medical Records", path: "/admin/medical-records" },
    { icon: "bi-person-badge", label: "Doctors", path: "/admin/doctors" },
    { icon: "bi-receipt", label: "Invoices", path: "/admin/invoices" },
    { icon: "bi-gear", label: "Settings", path: "/admin/settings" },
  ];

  return (
    <div className="admin-dashboard-wrapper">
      {/* Sidebar */}
      <aside
        className={`admin-sidebar bg-dark text-white vh-100 position-fixed top-0 start-0 d-flex flex-column ${
          sidebarCollapsed ? "collapsed" : ""
        }`}
      >
        {/* Logo */}
        <div className="admin-logo p-4 border-bottom border-secondary">
          <h4 className="mb-0 text-center">
            <span className="text-primary">OH</span>CP <br />
          </h4>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 mt-3 px-2">
          <ul className="nav flex-column">
            {/* Menu Items */}
            {menuItems.map((item) => (
              <li key={item.label} className="nav-item mb-1">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                  className={`nav-link d-flex align-items-center py-3 px-3 rounded-3 text-white ${
                    location.pathname === item.path ? "admin-active" : "admin-nav-hover"
                  }`}
                >
                  <i className={`bi ${item.icon} fs-5 ${sidebarCollapsed ? "" : "me-3"}`}></i>
                  <span className="admin-menu-label">{item.label}</span>
                  {location.pathname === item.path && !sidebarCollapsed && (
                    <i className="bi bi-chevron-right ms-auto"></i>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-top border-secondary">
          <button
            className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center"
            onClick={handleLogout}
          >
            <i className={`bi bi-box-arrow-right ${sidebarCollapsed ? "" : "me-2"}`}></i>
            <span className="admin-menu-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`admin-main ${sidebarCollapsed ? "admin-sidebar-collapsed" : ""}`}>
        {/* Topbar */}
        <header className="admin-topbar bg-white shadow-sm border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
          <button
            className="btn btn-link text-dark p-0"
            onClick={onToggleSidebar}
          >
            <i className="bi bi-list fs-3"></i>
          </button>

          <h5 className="mb-0 text-muted">Welcome back, Admin</h5>

          <div className="d-flex align-items-center gap-3">
            {/* Notifications */}
            <button className="btn btn-link position-relative text-dark p-0">
              <i className="bi bi-bell fs-5"></i>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                3
              </span>
            </button>

            {/* User Dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-link d-flex align-items-center text-decoration-none text-dark"
                data-bs-toggle="dropdown"
              >
                <img
                  src="/public/Hung/Admin.jpg"
                  alt="Admin"
                  className="rounded-circle me-2"
                  width="40"
                  height="40"
                />
                <span className="d-none d-md-inline"><b>Admin</b></span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="#">Profile</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item text-danger" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Logout</a></li>
              </ul>
            </div>
          </div>
        </header>

        {/* Page Content - passed as children */}
        {children}
      </div>
    </div>
  );
}
