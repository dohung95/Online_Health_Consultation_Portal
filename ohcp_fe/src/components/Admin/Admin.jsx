import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // Bootstrap Icons
import "./Admin.css"; // Scoped CSS file

export default function Admin() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Set flag để AdminRoute biết đang logout
      localStorage.setItem('isLoggingOut', 'true');
      // Navigate về trang chủ trước khi logout để tránh AdminRoute kiểm tra
      navigate("/");
      // Delay một chút để navigate hoàn tất trước khi xóa token
      setTimeout(async () => {
        await logout();
        localStorage.removeItem('isLoggingOut');
      }, 100);
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem('isLoggingOut');
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

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
            <span className="text-primary">Medi</span>Pro
          </h4>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 mt-3 px-2">
          <ul className="nav flex-column">
            {/* Home Link */}
            <li className="nav-item mb-1">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); handleGoHome(); }}
                className="nav-link d-flex align-items-center py-3 px-3 rounded-3 text-white admin-nav-hover"
              >
                <i className={`bi bi-house fs-5 ${sidebarCollapsed ? "" : "me-3"}`}></i>
                <span className="admin-menu-label">Home</span>
              </a>
            </li>

            {/* Other Menu Items */}
            {[
              { icon: "bi-speedometer2", label: "Dashboard", active: true },
              { icon: "bi-people", label: "Patients" },
              { icon: "bi-calendar-check", label: "Appointments" },
              { icon: "bi-file-medical", label: "Medical Records" },
              { icon: "bi-person-badge", label: "Doctors" },
              { icon: "bi-gear", label: "Settings" },
            ].map((item) => (
              <li key={item.label} className="nav-item mb-1">
                <a
                  href="#"
                  className={`nav-link d-flex align-items-center py-3 px-3 rounded-3 text-white ${
                    item.active ? "admin-active" : "admin-nav-hover"
                  }`}
                >
                  <i className={`bi ${item.icon} fs-5 ${sidebarCollapsed ? "" : "me-3"}`}></i>
                  <span className="admin-menu-label">{item.label}</span>
                  {item.active && !sidebarCollapsed && (
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
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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

        {/* Page Content */}
        <main className="admin-content p-4">
          <h2 className="mb-4">System Overview</h2>

          {/* Stats Cards */}
          <div className="row g-4 mb-5">
            {[
              { title: "Total Patients", value: "1,248", change: "+12.5%", color: "primary", icon: "bi-people" },
              { title: "Today's Appointments", value: "68", change: "+5%", color: "success", icon: "bi-calendar-check" },
              { title: "Pending Approval", value: "24", change: "-8%", color: "warning", icon: "bi-hourglass-split" },
              { title: "Monthly Revenue", value: "86.5M", change: "+18.3%", color: "info", icon: "bi-currency-dollar" },
            ].map((stat) => (
              <div key={stat.title} className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className={`admin-stat-icon bg-${stat.color} text-white rounded-3 p-3 me-4`}>
                      <i className={`bi ${stat.icon} fs-3`}></i>
                    </div>
                    <div>
                      <p className="text-muted mb-1 small">{stat.title}</p>
                      <h3 className="mb-0">{stat.value}</h3>
                      <small className={stat.change.startsWith("+") ? "text-success" : "text-danger"}>
                        {stat.change} from last month
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Appointments Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Appointments</h5>
              <button className="btn btn-primary btn-sm">View All</button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Patient Name</th>
                      <th>Time</th>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: "PT001248", name: "Nguyễn Văn An", time: "09:30", doctor: "Dr. Lan", status: "In Progress", badge: "warning" },
                      { id: "PT001247", name: "Trần Thị Mai", time: "10:00", doctor: "Dr. Hùng", status: "Completed", badge: "success" },
                      { id: "PT001246", name: "Lê Minh Tuấn", time: "10:30", doctor: "Dr. Minh", status: "Pending", badge: "secondary" },
                      { id: "PT001245", name: "Phạm Thị Hương", time: "11:00", doctor: "Dr. Ngọc", status: "Cancelled", badge: "danger" },
                    ].map((row) => (
                      <tr key={row.id}>
                        <td><strong>{row.id}</strong></td>
                        <td>{row.name}</td>
                        <td>{row.time}</td>
                        <td>{row.doctor}</td>
                        <td>
                          <span className={`badge bg-${row.badge}`}>{row.status}</span>
                        </td>
                        <td className="text-center">
                          <button className="btn btn-link text-primary p-0">
                            <i className="bi bi-eye fs-5"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}