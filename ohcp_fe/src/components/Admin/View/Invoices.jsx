import React, { useState, useEffect } from "react";
import NavbarAdmin from "./NavbarAdmin";
import { invoicesApi } from "../../../services/adminApi";
import Toast from "./Toast";
import useToast from "../useToast";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Css/Admin.css";

export default function Invoices() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    paid: 0,
    pending: 0,
    generated: 0,
    cancelled: 0
  });

  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    sortBy: 'newest'
  });

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await invoicesApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch invoices from API
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoicesApi.getAll({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        ...filters
      });

      setInvoices(response.invoices);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [pagination.pageNumber, filters]);

  const handleSearch = (e) => {
    setFilters({ ...filters, searchTerm: e.target.value });
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

  // Handle view invoice details
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  // Handle update status
  const handleUpdateStatus = (invoice) => {
    setSelectedInvoice(invoice);
    setNewStatus(invoice.status);
    setShowStatusModal(true);
  };

  // Submit status update
  const handleSubmitStatusUpdate = async (e) => {
    e.preventDefault();

    try {
      await invoicesApi.updateStatus(selectedInvoice.invoiceID, newStatus);
      showToast({
        title: 'Success!',
        message: 'Invoice status has been updated successfully',
        type: 'success'
      });
      setShowStatusModal(false);
      fetchInvoices();
      fetchStats();
    } catch (err) {
      showToast({
        title: 'Update Failed',
        message: err.response?.data?.error || 'Failed to update invoice status',
        type: 'error',
        duration: 5000
      });
      console.error('Error updating invoice status:', err);
    }
  };

  // Handle print invoice
  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    const invoice = selectedInvoice;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.invoiceID}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .invoice-header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #0d6efd;
            padding-bottom: 20px;
          }
          .invoice-header h1 {
            color: #0d6efd;
            margin: 0;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .info-section {
            flex: 1;
          }
          .info-section h3 {
            color: #0d6efd;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .info-row {
            margin-bottom: 10px;
          }
          .info-row strong {
            display: inline-block;
            width: 150px;
          }
          .amount-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
          }
          .amount-section h2 {
            color: #198754;
            margin: 0;
            font-size: 36px;
          }
          .amount-label {
            color: #6c757d;
            margin-bottom: 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-paid { background: #198754; color: white; }
          .status-pending { background: #ffc107; color: #000; }
          .status-generated { background: #0dcaf0; color: #000; }
          .status-cancelled { background: #dc3545; color: white; }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #6c757d;
            border-top: 2px solid #eee;
            padding-top: 20px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>ONLINE HEALTH CONSULTATION PORTAL</h1>
          <p>Medical Invoice</p>
        </div>

        <div class="invoice-info">
          <div class="info-section">
            <h3>Invoice Information</h3>
            <div class="info-row">
              <strong>Invoice ID:</strong> #${invoice.invoiceID}
            </div>
            <div class="info-row">
              <strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}
            </div>
            <div class="info-row">
              <strong>Status:</strong>
              <span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span>
            </div>
          </div>

          <div class="info-section">
            <h3>Patient Information</h3>
            <div class="info-row">
              <strong>Patient Name:</strong> ${invoice.patientName || 'N/A'}
            </div>
            <div class="info-row">
              <strong>Patient ID:</strong> ${invoice.patientID}
            </div>
            <div class="info-row">
              <strong>Appointment ID:</strong> #${invoice.appointmentID}
            </div>
          </div>
        </div>

        ${invoice.consultationType ? `
        <div class="info-section">
          <h3>Appointment Details</h3>
          <div class="info-row">
            <strong>Consultation Type:</strong> ${invoice.consultationType}
          </div>
          <div class="info-row">
            <strong>Appointment Status:</strong> ${invoice.appointmentStatus}
          </div>
        </div>
        ` : ''}

        <div class="amount-section">
          <div class="amount-label">TOTAL AMOUNT</div>
          <h2>${formatCurrency(invoice.amount)}</h2>
        </div>

        <div class="footer">
          <p>Thank you for choosing Online Health Consultation Portal</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'generated':
        return 'info';
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
          <h2 className="admin-page-title">Invoices Management</h2>
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
            { title: "Total Invoices", value: stats.totalInvoices, icon: "bi-receipt", color: "primary" },
            { title: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: "bi-currency-dollar", color: "success" },
            { title: "Paid", value: stats.paid, icon: "bi-check-circle", color: "info" },
            { title: "Pending", value: stats.pending, icon: "bi-hourglass-split", color: "warning" },
          ].map((stat) => (
            <div key={stat.title} className="col-lg-3 col-md-6">
              <div className="admin-stat-card h-100">
                <div className="d-flex align-items-center">
                  <div className={`admin-stat-icon ${stat.color} me-3`}>
                    <i className={`bi ${stat.icon}`}></i>
                  </div>
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '13px' }}>{stat.title}</p>
                    <h3 className="mb-0" style={{ fontSize: '28px', fontWeight: 700 }}>{stat.value}</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="admin-card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center" style={{ padding: "5px 10px" }}>
                <i className="bi bi-funnel me-2" style={{ color: 'var(--admin-text-light)' }}></i>
                <h6 className="mb-0" style={{ color: 'var(--admin-text-light)', fontSize: '13px', fontWeight: 600 }}>SEARCH & FILTERS</h6>
              </div>
              <div style={{ padding: "15px 5px 0 5px" }}>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setFilters({ searchTerm: '', status: '', sortBy: 'newest' });
                    setPagination({ ...pagination, pageNumber: 1 });
                  }}
                  style={{ fontSize: '12px' }}
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
                  placeholder="Search by invoice ID, patient name..."
                  value={filters.searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={handleStatusFilter}
                >
                  <option value="">All Status</option>
                  <option value="Generated">Generated</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-md-4" style={{padding:"0 20px 0 0"}}>
                <select
                  className="form-select"
                  value={filters.sortBy}
                  onChange={handleSort}
                >
                  <option value="newest">Sort by: Newest First</option>
                  <option value="oldest">Sort by: Oldest First</option>
                  <option value="amount-desc">Sort by: Highest Amount</option>
                  <option value="amount-asc">Sort by: Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="admin-card">
          <div className="card-body p-0">
            {loading ? (
              <div className="admin-loading">
                <div className="spinner-border" style={{ color: 'var(--admin-primary)' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="admin-empty-state">
                <i className="bi bi-inbox"></i>
                <p className="mt-2">No invoices found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table table mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Invoice ID</th>
                      <th>Patient Name</th>
                      <th>Appointment ID</th>
                      <th>Amount</th>
                      <th>Issue Date</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.invoiceID}>
                        <td><strong>#{invoice.invoiceID}</strong></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{ width: "35px", height: "35px" }}>
                              {invoice.patientName?.charAt(0) || 'P'}
                            </div>
                            {invoice.patientName || 'N/A'}
                          </div>
                        </td>
                        <td>#{invoice.appointmentID}</td>
                        <td><strong className="text-success">{formatCurrency(invoice.amount)}</strong></td>
                        <td>{formatDate(invoice.issueDate)}</td>
                        <td>
                          <span className={`badge bg-${getStatusBadgeClass(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="admin-btn-group">
                            <button
                              className="btn btn-outline-slate btn-sm"
                              title="View Details"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-outline-info btn-sm"
                              title="Update Status"
                              onClick={() => handleUpdateStatus(invoice)}
                            >
                              <i className="bi bi-pencil"></i>
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
          {!loading && invoices.length > 0 && (
            <div className="card-footer bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted" style={{ fontSize: '13px' }}>
                  Page <strong style={{ color: 'var(--admin-text)' }}>{pagination.pageNumber}</strong> of <strong style={{ color: 'var(--admin-text)' }}>{pagination.totalPages}</strong> • <strong style={{ color: 'var(--admin-text)' }}>{pagination.totalCount}</strong> total invoices
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

        {/* View Invoice Details Modal */}
        {showViewModal && selectedInvoice && (
          <div className="modal show d-block admin-modal-backdrop" tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content" style={{border: 'none', boxShadow: 'var(--shadow-lg)'}}>
                <div className="modal-header admin-modal-header primary" style={{borderBottom: 'none'}}>
                  <h5 className="modal-title">
                    <i className="bi bi-receipt me-2"></i>
                    Invoice Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowViewModal(false)}
                  ></button>
                </div>
                <div className="modal-body admin-modal-body" style={{backgroundColor: 'var(--admin-bg)'}}>
                  {/* Invoice Header */}
                  <div className="admin-card mb-4" style={{
                    background: 'linear-gradient(135deg, var(--admin-primary-dark) 0%, var(--admin-primary) 100%)',
                    color: 'white',
                    padding: 'var(--spacing-lg)'
                  }}>
                    <div className="row align-items-center">
                      <div className="col">
                        <div style={{fontSize: 'var(--font-size-sm)', opacity: 0.9, marginBottom: '4px'}}>Invoice ID</div>
                        <h4 className="mb-0" style={{fontWeight: '700'}}>#{selectedInvoice.invoiceID}</h4>
                      </div>
                      <div className="col-auto text-end">
                        <div style={{fontSize: 'var(--font-size-sm)', opacity: 0.9, marginBottom: '4px'}}>Total Amount</div>
                        <h3 className="mb-0" style={{fontWeight: '700'}}>{formatCurrency(selectedInvoice.amount)}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Information */}
                  <div className="admin-modal-section">
                    <h6 className="admin-modal-section-title primary">
                      <i className="bi bi-info-circle"></i>
                      Invoice Information
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="admin-info-row">
                          <strong>Issue Date:</strong>
                          <span>{formatDate(selectedInvoice.issueDate)}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="admin-info-row">
                          <strong>Status:</strong>
                          <span className={`admin-badge ${getStatusBadgeClass(selectedInvoice.status)}`}>
                            {selectedInvoice.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Information */}
                  <div className="admin-modal-section">
                    <h6 className="admin-modal-section-title primary">
                      <i className="bi bi-person"></i>
                      Patient Information
                    </h6>
                    <div className="admin-info-row">
                      <strong>Patient Name:</strong>
                      <span>{selectedInvoice.patientName || 'N/A'}</span>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="admin-info-row">
                          <strong>Patient ID:</strong>
                          <span>{selectedInvoice.patientID}</span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="admin-info-row">
                          <strong>Appointment ID:</strong>
                          <span>#{selectedInvoice.appointmentID}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  {selectedInvoice.consultationType && (
                    <div className="admin-modal-section">
                      <h6 className="admin-modal-section-title primary">
                        <i className="bi bi-calendar-check"></i>
                        Appointment Details
                      </h6>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="admin-info-row">
                            <strong>Consultation Type:</strong>
                            <span>{selectedInvoice.consultationType}</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="admin-info-row">
                            <strong>Appointment Status:</strong>
                            <span>{selectedInvoice.appointmentStatus}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-modal secondary"
                    onClick={() => setShowViewModal(false)}
                  >
                    <i className="bi bi-x-circle"></i>
                    Close
                  </button>
                  <button
                    type="button"
                    className="admin-btn-modal primary"
                    onClick={handlePrintInvoice}
                  >
                    <i className="bi bi-printer"></i>
                    Print Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showStatusModal && selectedInvoice && (
          <div className="modal show d-block admin-modal-backdrop" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content" style={{border: 'none', boxShadow: 'var(--shadow-lg)'}}>
                <div className="modal-header admin-modal-header primary" style={{borderBottom: 'none'}}>
                  <h5 className="modal-title">
                    <i className="bi bi-pencil-square me-2"></i>
                    Update Invoice Status
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowStatusModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmitStatusUpdate}>
                  <div className="modal-body admin-modal-body" style={{backgroundColor: 'var(--admin-bg)'}}>
                    {/* Invoice Summary */}
                    <div className="admin-modal-section">
                      <h6 className="admin-modal-section-title primary">
                        <i className="bi bi-receipt"></i>
                        Invoice Summary
                      </h6>
                      <div className="admin-info-row">
                        <strong>Invoice ID:</strong>
                        <span>#{selectedInvoice.invoiceID}</span>
                      </div>
                      <div className="admin-info-row">
                        <strong>Patient Name:</strong>
                        <span>{selectedInvoice.patientName || 'N/A'}</span>
                      </div>
                      <div className="admin-info-row">
                        <strong>Amount:</strong>
                        <span style={{color: 'var(--admin-success)', fontWeight: '600'}}>{formatCurrency(selectedInvoice.amount)}</span>
                      </div>
                      <div className="admin-info-row">
                        <strong>Current Status:</strong>
                        <span className={`admin-badge ${getStatusBadgeClass(selectedInvoice.status)}`}>
                          {selectedInvoice.status}
                        </span>
                      </div>
                    </div>

                    {/* Status Update */}
                    <div className="admin-modal-section">
                      <h6 className="admin-modal-section-title primary">
                        <i className="bi bi-arrow-repeat"></i>
                        Update Status
                      </h6>
                      <div className="mb-3">
                        <label className="admin-form-label">New Status <span className="text-danger">*</span></label>
                        <select
                          className="form-select admin-form-control"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          required
                        >
                          <option value="Generated">Generated</option>
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <div style={{fontSize: 'var(--font-size-xs)', color: 'var(--admin-text-light)', marginTop: 'var(--spacing-sm)'}}>
                          <i className="bi bi-info-circle me-1"></i>
                          Select the new status for this invoice
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="admin-modal-footer">
                    <button
                      type="button"
                      className="admin-btn-modal secondary"
                      onClick={() => setShowStatusModal(false)}
                    >
                      <i className="bi bi-x-circle"></i>
                      Cancel
                    </button>
                    <button type="submit" className="admin-btn-modal success">
                      <i className="bi bi-check-circle"></i>
                      Update Status
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
      <Toast
        show={toast.show}
        onClose={hideToast}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
      />
    </NavbarAdmin>
  );
}
