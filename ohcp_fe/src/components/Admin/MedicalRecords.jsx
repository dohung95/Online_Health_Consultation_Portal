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
  const [selectedRecord, setSelectedRecord] = useState(null);

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

  // Handle download record as PDF
  const handleDownloadRecord = (record) => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Record - ${record.healthRecordID}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #475569;
          }
          .header h1 {
            color: #1e293b;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header p {
            color: #64748b;
            font-size: 14px;
          }
          .record-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #475569;
          }
          .record-info h2 {
            color: #1e293b;
            font-size: 18px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-weight: 600;
            color: #475569;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .info-value {
            color: #1e293b;
            font-size: 14px;
          }
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .section h3 {
            color: #1e293b;
            font-size: 16px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
          }
          .section-content {
            padding: 10px 0;
          }
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          .badge-success {
            background: #dcfce7;
            color: #166534;
          }
          .badge-secondary {
            background: #f1f5f9;
            color: #475569;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Medical Record</h1>
          <p>Online Health Consultation Portal</p>
        </div>

        <div class="record-info">
          <h2>Record Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Record ID</span>
              <span class="info-value">#${record.healthRecordID}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Category</span>
              <span class="info-value">${record.category}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Record Date</span>
              <span class="info-value">${formatDate(record.date)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="info-value">
                <span class="badge ${record.status.toLowerCase() === 'active' ? 'badge-success' : 'badge-secondary'}">
                  ${record.status}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Last Updated</span>
              <span class="info-value">${formatDate(record.lastUpdated)}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Patient Information</h3>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Patient Name</span>
                <span class="info-value">${record.patientName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Patient ID</span>
                <span class="info-value">${record.patientID}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Doctor Information</h3>
          <div class="section-content">
            <div class="info-item">
              <span class="info-label">Doctor Name</span>
              <span class="info-value">${record.doctorName || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Diagnosis & Notes</h3>
          <div class="section-content">
            <div class="info-item">
              <span class="info-label">Diagnosis</span>
              <span class="info-value">${record.diagnosis || 'No diagnosis recorded'}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <p>This is a confidential medical document. Please handle with care.</p>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 30px; background: #475569; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
            Print / Save as PDF
          </button>
          <button onclick="window.close()" style="padding: 10px 30px; background: #e2e8f0; color: #475569; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-left: 10px;">
            Close
          </button>
        </div>

        <script>
          // Auto print dialog after page loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
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
                                className="btn btn-outline-secondary btn-sm"
                                title="Download"
                                onClick={() => handleDownloadRecord(record)}
                              >
                                <i className="bi bi-download"></i>
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
            <div className="modal show d-block admin-modal-backdrop" tabIndex="-1">
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content" style={{border: 'none', boxShadow: 'var(--shadow-lg)'}}>
                  <div className="modal-header admin-modal-header primary" style={{borderBottom: 'none'}}>
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
                  <div className="modal-body admin-modal-body" style={{backgroundColor: 'var(--admin-bg)'}}>
                    {/* Record Header Card */}
                    <div className="admin-card mb-4" style={{
                      background: 'linear-gradient(135deg, var(--admin-primary-dark) 0%, var(--admin-primary) 100%)',
                      color: 'white',
                      padding: 'var(--spacing-lg)'
                    }}>
                      <div className="row align-items-center">
                        <div className="col">
                          <div style={{fontSize: 'var(--font-size-sm)', opacity: 0.9, marginBottom: '4px'}}>Record ID</div>
                          <h4 className="mb-0" style={{fontWeight: '700'}}>#{selectedRecord.healthRecordID}</h4>
                        </div>
                        <div className="col-auto">
                          <div className="d-flex gap-2">
                            <div style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-md)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '600'
                            }}>
                              <i className="bi bi-bookmark me-1"></i>
                              {selectedRecord.category}
                            </div>
                            <div style={{
                              background: selectedRecord.status.toLowerCase() === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-md)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '600'
                            }}>
                              <i className={`bi bi-${selectedRecord.status.toLowerCase() === 'active' ? 'check-circle' : 'archive'} me-1`}></i>
                              {selectedRecord.status}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3" style={{borderTop: '1px solid rgba(255, 255, 255, 0.2)'}}>
                        <div className="row">
                          <div className="col-md-6">
                            <div style={{fontSize: 'var(--font-size-xs)', opacity: 0.8}}>Record Date</div>
                            <div style={{fontWeight: '600'}}>{formatDate(selectedRecord.date)}</div>
                          </div>
                          <div className="col-md-6 text-md-end">
                            <div style={{fontSize: 'var(--font-size-xs)', opacity: 0.8}}>Last Updated</div>
                            <div style={{fontWeight: '600'}}>{formatDate(selectedRecord.lastUpdated)}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      {/* Left Column */}
                      <div className="col-md-6">
                        {/* Patient Information */}
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-person"></i>
                            Patient Information
                          </h6>
                          <div className="admin-info-row">
                            <strong>Patient Name:</strong>
                            <span>{selectedRecord.patientName}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Patient ID:</strong>
                            <span>{selectedRecord.patientID}</span>
                          </div>
                        </div>

                        {/* Doctor Information */}
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-person-badge"></i>
                            Doctor Information
                          </h6>
                          <div className="admin-info-row">
                            <strong>Doctor Name:</strong>
                            <span>{selectedRecord.doctorName || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="col-md-6">
                        {/* Diagnosis */}
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-clipboard2-pulse"></i>
                            Diagnosis & Notes
                          </h6>
                          <div className="admin-info-row">
                            <strong>Diagnosis:</strong>
                            <span style={{display: 'block', marginTop: 'var(--spacing-sm)', whiteSpace: 'pre-wrap'}}>
                              {selectedRecord.diagnosis || 'No diagnosis recorded'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer" style={{backgroundColor: 'var(--admin-card-bg)', borderTop: '1px solid var(--admin-border)'}}>
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
        </main>
    </NavbarAdmin>
  );
}
