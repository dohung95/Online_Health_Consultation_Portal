import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "./NavbarAdmin";
import { patientsApi, doctorsApi, appointmentsApi, medicalRecordsApi } from "../../services/adminApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Admin.css";

export default function Admin() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    pendingApproval: 0,
    totalRecords: 0
  });

  const [recentAppointments, setRecentAppointments] = useState([]);

  // Fetch all stats from different APIs
  const fetchAllStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats from all APIs in parallel
      const [patientsData, doctorsData, appointmentsData, recordsData, recentApptData] = await Promise.all([
        patientsApi.getAll({ pageNumber: 1, pageSize: 1 }).catch(() => ({ totalCount: 0 })),
        doctorsApi.getStats().catch(() => ({ totalDoctors: 0 })),
        appointmentsApi.getStats().catch(() => ({ todayAppointments: 0, pendingApproval: 0 })),
        medicalRecordsApi.getStats().catch(() => ({ totalRecords: 0 })),
        appointmentsApi.getAll({ pageNumber: 1, pageSize: 5 }).catch(() => ({ appointments: [] }))
      ]);

      setStats({
        totalPatients: patientsData.totalCount || 0,
        totalDoctors: doctorsData.totalDoctors || 0,
        todayAppointments: appointmentsData.todayAppointments || 0,
        pendingApproval: appointmentsData.pendingApproval || 0,
        totalRecords: recordsData.totalRecords || 0
      });

      setRecentAppointments(recentApptData.appointments || []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'scheduled':
      case 'pending':
        return 'secondary';
      case 'in progress':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <NavbarAdmin
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <main className="admin-content p-4">
          <h2 className="mb-4">System Overview</h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="row g-4 mb-5">
                {[
                  { title: "Total Patients", value: stats.totalPatients, color: "primary", icon: "bi-people" },
                  { title: "Total Doctors", value: stats.totalDoctors, color: "info", icon: "bi-person-badge" },
                  { title: "Today's Appointments", value: stats.todayAppointments, color: "success", icon: "bi-calendar-check" },
                  { title: "Pending Approval", value: stats.pendingApproval, color: "warning", icon: "bi-hourglass-split" },
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
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Recent Appointments Table */}
          {!loading && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Appointments</h5>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/admin/appointments')}
                >
                  View All
                </button>
              </div>
              <div className="card-body p-0">
                {recentAppointments.length === 0 ? (
                  <div className="text-center p-5">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="mt-2 text-muted">No recent appointments</p>
                  </div>
                ) : (
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
                        {recentAppointments.map((row) => (
                          <tr key={row.appointmentID}>
                            <td><strong>{row.appointmentID}</strong></td>
                            <td>{row.patientName}</td>
                            <td>{row.time}</td>
                            <td>{row.doctorName}</td>
                            <td>
                              <span className={`badge bg-${getStatusBadgeClass(row.status)}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-link text-primary p-0"
                                onClick={() => navigate('/admin/appointments')}
                              >
                                <i className="bi bi-eye fs-5"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
    </NavbarAdmin>
  );
}