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

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    category: '',
    diagnosis: '',
    status: ''
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

  // Handle view record
  const handleViewRecord = async (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  // Handle edit record
  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setEditForm({
      category: record.category || '',
      diagnosis: record.diagnosis || '',
      status: record.status || ''
    });
    setShowEditModal(true);
  };

  // Handle update record
  const handleUpdateRecord = async (e) => {
    e.preventDefault();

    try {
      await medicalRecordsApi.update(selectedRecord.healthRecordID);
      alert('Medical record updated successfully');
      setShowEditModal(false);
      fetchRecords();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update medical record');
      console.error('Error updating medical record:', err);
    }
  };

  // Handle download record - Generate compact PDF report
  const handleDownloadRecord = (record) => {
    const printWindow = window.open('', '_blank');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Record #${record.healthRecordID}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
            font-size: 11pt;
            line-height: 1.3;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #0d6efd;
            padding-bottom: 8px;
          }
          .header h1 {
            color: #0d6efd;
            font-size: 18pt;
            margin-bottom: 3px;
          }
          .header p {
            color: #6c757d;
            font-size: 10pt;
          }
          .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          .info-section h3 {
            color: #0d6efd;
            font-size: 12pt;
            margin-bottom: 8px;
            padding-bottom: 3px;
            border-bottom: 1px solid #dee2e6;
          }
          .info-row {
            margin-bottom: 5px;
            font-size: 10pt;
          }
          .info-row strong {
            color: #495057;
            display: inline-block;
            width: 110px;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 9pt;
          }
          .badge-success { background: #198754; color: white; }
          .badge-warning { background: #ffc107; color: #000; }
          .diagnosis-box {
            background: #fff3cd;
            border-left: 3px solid #ffc107;
            padding: 10px;
            margin: 15px 0;
            grid-column: 1 / -1;
          }
          .diagnosis-box h4 {
            color: #856404;
            font-size: 11pt;
            margin-bottom: 5px;
          }
          .diagnosis-box p {
            font-size: 10pt;
            color: #333;
          }
          .footer {
            margin-top: 15px;
            text-align: center;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
            padding-top: 8px;
            font-size: 8pt;
          }
          @media print {
            body { padding: 15px; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ONLINE HEALTH CONSULTATION PORTAL</h1>
          <p>Medical Record Report</p>
        </div>

        <div class="content">
          <div class="info-section">
            <h3>Record Information</h3>
            <div class="info-row">
              <strong>Record ID:</strong> #${record.healthRecordID}
            </div>
            <div class="info-row">
              <strong>Date:</strong> ${new Date(record.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div class="info-row">
              <strong>Last Updated:</strong> ${new Date(record.lastUpdated).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div class="info-row">
              <strong>Category:</strong> ${record.category || 'General'}
            </div>
            <div class="info-row">
              <strong>Status:</strong> <span class="badge badge-${record.status === 'Active' ? 'success' : 'warning'}">${record.status}</span>
            </div>
          </div>

          <div class="info-section">
            <h3>Patient & Doctor</h3>
            <div class="info-row">
              <strong>Patient Name:</strong> ${record.patientName || 'N/A'}
            </div>
            <div class="info-row">
              <strong>Patient ID:</strong> ${record.patientID}
            </div>
            <div class="info-row">
              <strong>Doctor:</strong> ${record.doctorName || 'N/A'}
            </div>
          </div>

          <div class="diagnosis-box">
            <h4>Diagnosis</h4>
            <p>${record.diagnosis || 'No diagnosis recorded'}</p>
          </div>
        </div>

        <div class="footer">
          <p>Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} | Confidential Medical Information</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
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
            <h2 className="admin-page-title">Medical Records</h2>
          </div>

          {error && (
            <div className="alert alert-danger admin-alert" role="alert">
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
                    setFilters({ searchTerm: '', fromDate: '', toDate: '', category: '' });
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
                <div className="col-md-5" style={{padding:"0 0 10px 20px"}}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by patient name, record ID..."
                    value={filters.searchTerm}
                    onChange={handleSearch}
                  />
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
                <div className="col-md-3" style={{padding:"0 20px 0 0"}}>
                  <select
                    className="form-select"
                    value={filters.category}
                    onChange={handleCategoryFilter}
                    style={{paddingTop:"10px"}}
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
          <div className="admin-card">
            <div className="card-body p-0">
              {loading ? (
                <div className="admin-loading">
                  <div className="spinner-border" style={{color: 'var(--admin-primary)'}} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading medical records...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="admin-empty-state">
                  <i className="bi bi-inbox"></i>
                  <p className="mt-2">No medical records found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table table mb-0 align-middle">
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
                            <div className="admin-btn-group">
                              <button
                                className="btn btn-outline-slate btn-sm"
                                title="View Record"
                                onClick={() => handleViewRecord(record)}
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="btn btn-outline-info btn-sm"
                                title="Edit"
                                onClick={() => handleEditRecord(record)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                title="Download"
                                onClick={() => handleDownloadRecord(record)}
                              >
                                <i className="bi bi-download"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
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
                  <span className="text-muted" style={{fontSize: '13px'}}>
                    Page <strong style={{color: 'var(--admin-text)'}}>{pagination.pageNumber}</strong> of <strong style={{color: 'var(--admin-text)'}}>{pagination.totalPages}</strong> • <strong style={{color: 'var(--admin-text)'}}>{pagination.totalCount}</strong> total records
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
                          for (let i = 1; i <= totalPages; i++) {
                            pageNumbers.push(i);
                          }
                        } else {
                          pageNumbers.push(1);

                          if (currentPage > 3) {
                            pageNumbers.push('...');
                          }

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

          {/* View Medical Record Modal */}
          {showViewModal && selectedRecord && (
            <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                  <div className="admin-modal-header primary">
                    <h5 className="modal-title">
                      <i className="bi bi-file-medical me-2"></i>
                      Medical Record Details
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowViewModal(false)}
                    ></button>
                  </div>
                  <div className="admin-modal-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-info-circle me-2"></i>
                            Record Information
                          </h6>
                          <div className="mb-3">
                            <strong>Record ID:</strong>
                            <p className="mb-0">{selectedRecord.healthRecordID}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Date:</strong>
                            <p className="mb-0">{formatDate(selectedRecord.date)}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Category:</strong>
                            <p className="mb-0">
                              <span className="badge bg-light text-dark border">
                                {selectedRecord.category}
                              </span>
                            </p>
                          </div>
                          <div className="mb-3">
                            <strong>Status:</strong>
                            <p className="mb-0">
                              <span className={`badge bg-${selectedRecord.status.toLowerCase() === 'active' ? 'success' : 'secondary'}`}>
                                {selectedRecord.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title info">
                            <i className="bi bi-people me-2"></i>
                            Patient & Doctor Information
                          </h6>
                          <div className="mb-3">
                            <strong>Patient Name:</strong>
                            <p className="mb-0">{selectedRecord.patientName}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Doctor Name:</strong>
                            <p className="mb-0">{selectedRecord.doctorName || 'N/A'}</p>
                          </div>
                          <div className="mb-3">
                            <strong>Diagnosis:</strong>
                            <p className="mb-0">{selectedRecord.diagnosis}</p>
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

          {/* Edit Medical Record Modal */}
          {showEditModal && selectedRecord && (
            <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="admin-modal-header info">
                    <h5 className="modal-title">
                      <i className="bi bi-pencil-square me-2"></i>
                      Edit Medical Record
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowEditModal(false)}
                    ></button>
                  </div>
                  <form onSubmit={handleUpdateRecord}>
                    <div className="admin-modal-body">
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Note:</strong> You are viewing record for {selectedRecord.patientName}
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">Category</label>
                          <select
                            className="form-select"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            disabled
                          >
                            <option value="Diagnosis">Diagnosis</option>
                            <option value="Lab Results">Lab Results</option>
                            <option value="Prescription">Prescription</option>
                            <option value="X-Ray/Imaging">X-Ray/Imaging</option>
                            <option value="Surgery Report">Surgery Report</option>
                          </select>
                          <small className="text-muted">Category cannot be changed</small>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">Status <span className="text-danger">*</span></label>
                          <select
                            className="form-select"
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            disabled
                          >
                            <option value="Active">Active</option>
                            <option value="Archived">Archived</option>
                          </select>
                          <small className="text-muted">Status cannot be changed via this form</small>
                        </div>
                        <div className="col-12 mb-3">
                          <label className="form-label fw-semibold">Diagnosis</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            value={editForm.diagnosis}
                            onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })}
                            disabled
                          ></textarea>
                          <small className="text-muted">Diagnosis is read-only</small>
                        </div>
                      </div>
                      <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>Current Limitation:</strong> The backend API only supports approving/updating status of records, not full editing of content.
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
                        Approve Record
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
