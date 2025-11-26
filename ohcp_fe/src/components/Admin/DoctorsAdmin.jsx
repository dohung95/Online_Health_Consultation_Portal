import React, { useState, useEffect } from "react";
import NavbarAdmin from "./NavbarAdmin";
import { doctorsApi } from "../../services/adminApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Admin.css";

export default function DoctorsAdmin() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    onDutyToday: 0,
    onLeave: 0,
    newThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 6,
    totalCount: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    searchTerm: '',
    specialty: '',
    status: '',
    sortBy: 'name'
  });

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await doctorsApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await doctorsApi.getAll({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        ...filters
      });

      setDoctors(response.doctors);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch doctors');
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [pagination.pageNumber, filters]);

  const handleSearch = (e) => {
    setFilters({ ...filters, searchTerm: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handleSpecialtyFilter = (e) => {
    setFilters({ ...filters, specialty: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handleStatusFilter = (e) => {
    setFilters({ ...filters, status: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handleSort = (e) => {
    setFilters({ ...filters, sortBy: e.target.value });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, pageNumber: newPage });
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) {
      return;
    }

    try {
      await doctorsApi.delete(doctorId);
      alert('Doctor deleted successfully');
      fetchDoctors();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete doctor');
      console.error('Error deleting doctor:', err);
    }
  };

  return (
    <NavbarAdmin
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <main className="admin-content p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Doctors List</h2>
            <button className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Doctor
            </button>
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
              { title: "Total Doctors", value: stats.totalDoctors, icon: "bi-person-badge", color: "primary" },
              { title: "On Duty Today", value: stats.onDutyToday, icon: "bi-calendar-check", color: "success" },
              { title: "On Leave", value: stats.onLeave, icon: "bi-calendar-x", color: "warning" },
              { title: "New This Month", value: stats.newThisMonth, icon: "bi-person-plus", color: "info" },
            ].map((stat) => (
              <div key={stat.title} className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex align-items-center">
                    <div className={`admin-stat-icon bg-${stat.color} text-white rounded-3 p-3 me-3`}>
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

          {/* Filter and Search */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-5">
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, ID, or specialization..."
                      value={filters.searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filters.specialty}
                    onChange={handleSpecialtyFilter}
                  >
                    <option value="">All Departments</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="General Practice">General Practice</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={handleStatusFilter}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="on leave">On Leave</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={filters.sortBy}
                    onChange={handleSort}
                  >
                    <option value="name">Sort by: Name</option>
                    <option value="experience">Sort by: Experience</option>
                    <option value="rating">Sort by: Rating</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Doctors Grid */}
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center p-5">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="mt-2 text-muted">No doctors found</p>
            </div>
          ) : (
            <div className="row g-4">
              {doctors.map((doctor) => (
                <div key={doctor.doctorID} className="col-lg-4 col-md-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-start mb-3">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{width: "60px", height: "60px", fontSize: "24px"}}>
                          {doctor.fullName.charAt(0)}
                        </div>
                        <div className="flex-grow-1">
                          <h5 className="mb-1">{doctor.fullName}</h5>
                          <p className="text-muted mb-1 small">{doctor.doctorID.substring(0, 8)}</p>
                          <span className={`badge bg-${doctor.status.toLowerCase() === 'active' ? 'success' : 'warning'}`}>
                            {doctor.status}
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted small">
                            <i className="bi bi-hospital me-1"></i>
                            {doctor.specialty}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted small">
                            <i className="bi bi-briefcase me-1"></i>
                            {doctor.yearsOfExperience} years
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted small">
                            <i className="bi bi-people me-1"></i>
                            {doctor.totalPatients} patients
                          </span>
                          <span className="text-warning small">
                            <i className="bi bi-star-fill me-1"></i>
                            {doctor.averageRating ? doctor.averageRating.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary flex-grow-1">
                          <i className="bi bi-eye me-1"></i>
                          View Profile
                        </button>
                        <button className="btn btn-sm btn-outline-success">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(doctor.doctorID)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && doctors.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <span className="text-muted">
                Showing {((pagination.pageNumber - 1) * pagination.pageSize) + 1} to {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} doctors
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
                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <li
                      key={index + 1}
                      className={`page-item ${pagination.pageNumber === index + 1 ? 'active' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
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
          )}
        </main>
    </NavbarAdmin>
  );
}
