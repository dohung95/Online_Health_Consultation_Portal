import React, { useState, useEffect } from "react";
import NavbarAdmin from "./NavbarAdmin";
import { medicalRecordsApi } from "../../services/adminApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Admin.css";

export default function MedicalRecords() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    recentUpdates: 0,
    pendingReview: 0,
    archived: 0
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
    fromDate: '',
    toDate: '',
    category: ''
  });

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await medicalRecordsApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch medical records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await medicalRecordsApi.getAll({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        ...filters
      });

      setRecords(response.records);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch medical records');
      console.error('Error fetching medical records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [pagination.pageNumber, filters]);

  const handleSearch = (e) => {
    setFilters({ ...filters, searchTerm: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handleFromDateFilter = (e) => {
    setFilters({ ...filters, fromDate: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handleToDateFilter = (e) => {
    setFilters({ ...filters, toDate: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handleCategoryFilter = (e) => {
    setFilters({ ...filters, category: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, pageNumber: newPage });
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) {
      return;
    }

    try {
      await medicalRecordsApi.delete(recordId);
      alert('Medical record deleted successfully');
      fetchRecords();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete medical record');
      console.error('Error deleting medical record:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <NavbarAdmin
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <main className="admin-content p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Medical Records</h2>
            <button className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Record
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
              { title: "Total Records", value: stats.totalRecords, icon: "bi-file-medical", color: "primary" },
              { title: "Recent Updates", value: stats.recentUpdates, icon: "bi-arrow-clockwise", color: "success" },
              { title: "Pending Review", value: stats.pendingReview, icon: "bi-hourglass-split", color: "warning" },
              { title: "Archived", value: stats.archived, icon: "bi-archive", color: "secondary" },
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
                      placeholder="Search by patient name, record ID..."
                      value={filters.searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                </div>
                <div className="col-md-2">
                  <input
                    type="date"
                    className="form-control"
                    placeholder="From Date"
                    value={filters.fromDate}
                    onChange={handleFromDateFilter}
                  />
                </div>
                <div className="col-md-2">
                  <input
                    type="date"
                    className="form-control"
                    placeholder="To Date"
                    value={filters.toDate}
                    onChange={handleToDateFilter}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filters.category}
                    onChange={handleCategoryFilter}
                  >
                    <option value="">All Categories</option>
                    <option value="Diagnosis">Diagnosis</option>
                    <option value="Lab Results">Lab Results</option>
                    <option value="Prescription">Prescription</option>
                    <option value="X-Ray/Imaging">X-Ray/Imaging</option>
                    <option value="Surgery Report">Surgery Report</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Records Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading medical records...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="text-center p-5">
                  <i className="bi bi-inbox fs-1 text-muted"></i>
                  <p className="mt-2 text-muted">No medical records found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Record ID</th>
                        <th>Patient Name</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Diagnosis</th>
                        <th>Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.healthRecordID}>
                          <td><strong>{record.healthRecordID}</strong></td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center me-2" style={{width: "35px", height: "35px"}}>
                                {record.patientName.charAt(0)}
                              </div>
                              {record.patientName}
                            </div>
                          </td>
                          <td>{record.doctorName || 'N/A'}</td>
                          <td>{formatDate(record.date)}</td>
                          <td>
                            <span className="badge bg-light text-dark border">{record.category}</span>
                          </td>
                          <td>{record.diagnosis}</td>
                          <td>
                            <span className={`badge bg-${record.status.toLowerCase() === 'active' ? 'success' : 'secondary'}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm" role="group">
                              <button className="btn btn-outline-primary" title="View Record">
                                <i className="bi bi-eye"></i>
                              </button>
                              <button className="btn btn-outline-success" title="Edit">
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button className="btn btn-outline-info" title="Download">
                                <i className="bi bi-download"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                title="Delete"
                                onClick={() => handleDelete(record.healthRecordID)}
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
            {!loading && records.length > 0 && (
              <div className="card-footer bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">
                    Showing {((pagination.pageNumber - 1) * pagination.pageSize) + 1} to {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} records
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
              </div>
            )}
          </div>
        </main>
    </NavbarAdmin>
  );
}
