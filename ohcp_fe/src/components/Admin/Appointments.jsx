import React, { useState, useEffect } from "react";
import NavbarAdmin from "./NavbarAdmin";
import { appointmentsApi } from "../../services/adminApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Admin.css";

export default function Appointments() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingApproval: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    searchTerm: '',
    date: '',
    status: '',
    doctorId: ''
  });

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    appointmentDate: '',
    appointmentTime: '',
    consultationType: '',
    status: '',
    reason: '',
    notes: ''
  });

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await appointmentsApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentsApi.getAll({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        ...filters
      });

      setAppointments(response.appointments);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [pagination.pageNumber, filters]);

  const handleSearch = (e) => {
    setFilters({ ...filters, searchTerm: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handleDateFilter = (e) => {
    setFilters({ ...filters, date: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handleStatusFilter = (e) => {
    setFilters({ ...filters, status: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handleDoctorFilter = (e) => {
    setFilters({ ...filters, doctorId: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, pageNumber: newPage });
  };

  // Handle view appointment details
  const handleViewAppointment = async (appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  };

  // Handle edit appointment
  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setEditForm({
      appointmentDate: appointment.date || '',
      appointmentTime: appointment.time || '',
      consultationType: appointment.consultationType || '',
      status: appointment.status || '',
      reason: appointment.reason || '',
      notes: appointment.notes || ''
    });
    setShowEditModal(true);
  };

  // Handle update appointment
  const handleUpdateAppointment = async (e) => {
    e.preventDefault();

    try {
      // Combine date and time into DateTime
      const appointmentDateTime = new Date(`${editForm.appointmentDate}T${editForm.appointmentTime}:00`);

      // Prepare data according to UpdateAppointmentAdminDto
      const updateData = {
        appointmentTime: appointmentDateTime.toISOString(),
        consultationType: editForm.consultationType,
        status: editForm.status
      };

      await appointmentsApi.update(selectedAppointment.appointmentID, updateData);
      alert('Appointment updated successfully');
      setShowEditModal(false);
      fetchAppointments();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update appointment');
      console.error('Error updating appointment:', err);
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      await appointmentsApi.delete(appointmentId);
      alert('Appointment deleted successfully');
      fetchAppointments();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete appointment');
      console.error('Error deleting appointment:', err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Appointments</h2>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="row g-4 mb-4">
            {[
              { title: "Today's Appointments", value: stats.todayAppointments, icon: "bi-calendar-check", color: "success" },
              { title: "Pending Approval", value: stats.pendingApproval, icon: "bi-hourglass-split", color: "warning" },
              { title: "Completed", value: stats.completed, icon: "bi-check-circle", color: "info" },
              { title: "Cancelled", value: stats.cancelled, icon: "bi-x-circle", color: "danger" },
            ].map((stat) => (
              <div key={stat.title} className="col-lg-3 col-md-6">
                <div className="admin-stat-card h-100">
                  <div className="d-flex align-items-center">
                    <div className={`admin-stat-icon ${stat.color} me-3`}>
                      <i className={`bi ${stat.icon}`}></i>
                    </div>
                    <div>
                      <p className="text-muted mb-1" style={{fontSize: '13px'}}>{stat.title}</p>
                      <h3 className="mb-0" style={{fontSize: '28px', fontWeight: 700}}>{stat.value}</h3>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter and Search */}
          <div className="admin-card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center" style={{padding:"5px 10px"}}> 
                  <i className="bi bi-funnel me-2" style={{color: 'var(--admin-text-light)'}}></i>
                  <h6 className="mb-0" style={{color: 'var(--admin-text-light)', fontSize: '13px', fontWeight: 600}}>SEARCH & FILTERS</h6>
                </div>
                <div style={{padding:"15px 5px 0 5px"}}>
                  <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setFilters({ searchTerm: '', date: '', status: '', doctorId: '' });
                    setPagination({ ...pagination, pageNumber: 1 });
                  }}
                  style={{fontSize: '12px'}}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Clear Filters
                </button>
                </div>
              </div>
              <div className="row g-3">
                <div className="col-md-4" style={{padding:"0 0 10px 20px"}}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by patient, doctor, ID..."
                    value={filters.searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                <div className="col-md-2">
                  <input
                    type="date"
                    className="form-control"
                    value={filters.date}
                    onChange={handleDateFilter}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={handleStatusFilter}
                  >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-md-3"style={{padding:"0 20px 0 0"}}>
                  <select
                    className="form-select"
                    value={filters.doctorId}
                    onChange={handleDoctorFilter}
                  >
                    <option value="">All Doctors</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading appointments...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="admin-empty-state">
                  <i className="bi bi-inbox"></i>
                  <p className="mt-2">No appointments found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table table mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Patient Name</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr key={appointment.appointmentID}>
                          <td><strong>{appointment.appointmentID}</strong></td>
                          <td>{appointment.patientName}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-2" style={{width: "30px", height: "30px", fontSize: "12px"}}>
                                {appointment.doctorName.charAt(0)}
                              </div>
                              {appointment.doctorName}
                            </div>
                          </td>
                          <td>{appointment.date}</td>
                          <td><strong>{appointment.time}</strong></td>
                          <td>{appointment.department}</td>
                          <td>
                            <span className={`badge bg-${getStatusBadgeClass(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="admin-btn-group">
                              <button
                                className="btn btn-outline-slate btn-sm"
                                title="View Details"
                                onClick={() => handleViewAppointment(appointment)}
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="btn btn-outline-info btn-sm"
                                title="Edit"
                                onClick={() => handleEditAppointment(appointment)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                title="Delete"
                                onClick={() => handleDelete(appointment.appointmentID)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {!loading && appointments.length > 0 && (
              <div className="card-footer bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted" style={{fontSize: '13px'}}>
                    Page <strong style={{color: 'var(--admin-text)'}}>{pagination.pageNumber}</strong> of <strong style={{color: 'var(--admin-text)'}}>{pagination.totalPages}</strong> • <strong style={{color: 'var(--admin-text)'}}>{pagination.totalCount}</strong> total appointments
                  </span>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${pagination.pageNumber === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pagination.pageNumber - 1)}
                          disabled={pagination.pageNumber === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {(() => {
                        const pageNumbers = [];
                        const totalPages = pagination.totalPages;
                        const currentPage = pagination.pageNumber;

                        if (totalPages <= 7) {
                          // Show all pages if 7 or less
                          for (let i = 1; i <= totalPages; i++) {
                            pageNumbers.push(i);
                          }
                        } else {
                          // Always show first page
                          pageNumbers.push(1);

                          if (currentPage > 3) {
                            pageNumbers.push('...');
                          }

                          // Show current page and neighbors
                          const start = Math.max(2, currentPage - 1);
                          const end = Math.min(totalPages - 1, currentPage + 1);

                          for (let i = start; i <= end; i++) {
                            if (!pageNumbers.includes(i)) {
                              pageNumbers.push(i);
                            }
                          }

                          if (currentPage < totalPages - 2) {
                            pageNumbers.push('...');
                          }

                          // Always show last page
                          if (!pageNumbers.includes(totalPages)) {
                            pageNumbers.push(totalPages);
                          }
                        }

                        return pageNumbers.map((page, index) => {
                          if (page === '...') {
                            return (
                              <li key={`ellipsis-${index}`} className="page-item disabled">
                                <span className="page-link">...</span>
                              </li>
                            );
                          }
                          return (
                            <li
                              key={page}
                              className={`page-item ${pagination.pageNumber === page ? 'active' : ''}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </li>
                          );
                        });
                      })()}
                      <li className={`page-item ${pagination.pageNumber === pagination.totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pagination.pageNumber + 1)}
                          disabled={pagination.pageNumber === pagination.totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </div>

          {/* View Appointment Details Modal */}
          {showViewModal && selectedAppointment && (
            <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      <i className="bi bi-calendar-check me-2"></i>
                      Appointment Details
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowViewModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row">
                      {/* Left Column */}
                      <div className="col-md-6">
                        <div className="mb-4">
                          <h6 className="text-primary border-bottom pb-2 mb-3">
                            <i className="bi bi-info-circle me-2"></i>
                            Appointment Information
                          </h6>
                          <div className="mb-3">
                            <strong>Appointment ID:</strong>
                            <p className="mb-0">{selectedAppointment.appointmentID}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Date:</strong>
                            <p className="mb-0">{selectedAppointment.date}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Time:</strong>
                            <p className="mb-0">{selectedAppointment.time}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Consultation Type:</strong>
                            <p className="mb-0">{selectedAppointment.consultationType || 'N/A'}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Status:</strong>
                            <p className="mb-0">
                              <span className={`badge bg-${getStatusBadgeClass(selectedAppointment.status)}`}>
                                {selectedAppointment.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="col-md-6">
                        <div className="mb-4">
                          <h6 className="text-success border-bottom pb-2 mb-3">
                            <i className="bi bi-people me-2"></i>
                            Patient & Doctor Information
                          </h6>
                          <div className="mb-3">
                            <strong>Patient Name:</strong>
                            <p className="mb-0">{selectedAppointment.patientName}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Doctor Name:</strong>
                            <p className="mb-0">{selectedAppointment.doctorName}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Department:</strong>
                            <p className="mb-0">{selectedAppointment.department}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Reason:</strong>
                            <p className="mb-0">{selectedAppointment.reason || 'No reason provided'}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Notes:</strong>
                            <p className="mb-0">{selectedAppointment.notes || 'No notes'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowViewModal(false)}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Appointment Modal */}
          {showEditModal && selectedAppointment && (
            <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
              <div className="modal-dialog modal-xl" style={{maxWidth: '90%'}}>
                <div className="modal-content">
                  <div className="modal-header bg-success text-white">
                    <h5 className="modal-title">
                      <i className="bi bi-pencil-square me-2"></i>
                      Edit Appointment
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowEditModal(false)}
                    ></button>
                  </div>
                  <form onSubmit={handleUpdateAppointment}>
                    <div className="modal-body" style={{maxHeight: '75vh', overflowY: 'auto'}}>
                      <div className="row">
                        {/* Left Column - Basic Information */}
                        <div className="col-lg-6">
                          <div className="mb-4">
                            <h6 className="text-primary border-bottom pb-2 mb-3">
                              <i className="bi bi-calendar-event me-2"></i>
                              Appointment Details
                            </h6>
                            <div className="mb-3">
                              <strong className="d-block mb-2">Patient:</strong>
                              <p className="text-muted">{selectedAppointment.patientName}</p>
                            </div>
                            <div className="mb-3">
                              <strong className="d-block mb-2">Doctor:</strong>
                              <p className="text-muted">{selectedAppointment.doctorName}</p>
                            </div>
                            <div className="mb-3">
                              <strong className="d-block mb-2">Department:</strong>
                              <p className="text-muted">{selectedAppointment.department}</p>
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Appointment Date <span className="text-danger">*</span></label>
                              <input
                                type="date"
                                className="form-control"
                                value={editForm.appointmentDate}
                                onChange={(e) => setEditForm({ ...editForm, appointmentDate: e.target.value })}
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Appointment Time <span className="text-danger">*</span></label>
                              <input
                                type="time"
                                className="form-control"
                                value={editForm.appointmentTime}
                                onChange={(e) => setEditForm({ ...editForm, appointmentTime: e.target.value })}
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Consultation Type <span className="text-danger">*</span></label>
                              <select
                                className="form-select"
                                value={editForm.consultationType}
                                onChange={(e) => setEditForm({ ...editForm, consultationType: e.target.value })}
                                required
                              >
                                <option value="">Select Type</option>
                                <option value="Video">Video Call</option>
                                <option value="Chat">Chat</option>
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Status <span className="text-danger">*</span></label>
                              <select
                                className="form-select"
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                required
                              >
                                <option value="Pending">Pending</option>
                                <option value="Scheduled">Scheduled</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Additional Information */}
                        <div className="col-lg-6">
                          <div className="mb-4">
                            <h6 className="text-success border-bottom pb-2 mb-3">
                              <i className="bi bi-file-text me-2"></i>
                              Additional Information
                            </h6>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Reason for Visit</label>
                              <textarea
                                className="form-control"
                                rows="5"
                                value={editForm.reason}
                                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                placeholder="Enter reason for appointment..."
                              ></textarea>
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Notes</label>
                              <textarea
                                className="form-control"
                                rows="8"
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                placeholder="Enter any additional notes..."
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer bg-light">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowEditModal(false)}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-success">
                        <i className="bi bi-check-circle me-2"></i>
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
    </NavbarAdmin>
  );
}
