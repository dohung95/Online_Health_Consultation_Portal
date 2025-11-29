import React, { useState, useEffect } from "react";
import NavbarAdmin from "./NavbarAdmin";
import { invoicesApi } from "../../services/adminApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Admin.css";

export default function Invoices() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [invoices, setInvoices] = useState([]);
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
      alert('Invoice status updated successfully');
      setShowStatusModal(false);
      fetchInvoices();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update invoice status');
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
          <h2>Invoices Management</h2>
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
            { title: "Total Invoices", value: stats.totalInvoices, icon: "bi-receipt", color: "primary" },
            { title: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: "bi-currency-dollar", color: "success" },
            { title: "Paid", value: stats.paid, icon: "bi-check-circle", color: "info" },
            { title: "Pending", value: stats.pending, icon: "bi-hourglass-split", color: "warning" },
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

        {/* Search and Filter */}
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
                    placeholder="Search by invoice ID, patient name, appointment ID..."
                    value={filters.searchTerm}
                    onChange={handleSearch}
                  />
                </div>
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
              <div className="col-md-4">
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
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center p-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <p className="mt-2 text-muted">No invoices found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
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
                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{width: "35px", height: "35px"}}>
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
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              className="btn btn-outline-primary"
                              title="View Details"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-outline-success"
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
                <span className="text-muted">
                  Showing {((pagination.pageNumber - 1) * pagination.pageSize) + 1} to {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} invoices
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

        {/* View Invoice Details Modal */}
        {showViewModal && selectedInvoice && (
          <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-receipt me-2"></i>
                    Invoice Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowViewModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-6">
                      <strong>Invoice ID:</strong>
                      <p>#{selectedInvoice.invoiceID}</p>
                    </div>
                    <div className="col-6">
                      <strong>Status:</strong>
                      <p>
                        <span className={`badge bg-${getStatusBadgeClass(selectedInvoice.status)}`}>
                          {selectedInvoice.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-12">
                      <strong>Patient Name:</strong>
                      <p>{selectedInvoice.patientName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <strong>Patient ID:</strong>
                      <p>{selectedInvoice.patientID}</p>
                    </div>
                    <div className="col-6">
                      <strong>Appointment ID:</strong>
                      <p>#{selectedInvoice.appointmentID}</p>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-12">
                      <strong>Issue Date:</strong>
                      <p>{formatDate(selectedInvoice.issueDate)}</p>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-12">
                      <strong>Amount:</strong>
                      <h4 className="text-success">{formatCurrency(selectedInvoice.amount)}</h4>
                    </div>
                  </div>
                  {selectedInvoice.consultationType && (
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="card-title">Appointment Details</h6>
                        <p className="mb-1"><strong>Type:</strong> {selectedInvoice.consultationType}</p>
                        <p className="mb-0"><strong>Status:</strong> {selectedInvoice.appointmentStatus}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowViewModal(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePrintInvoice}
                  >
                    <i className="bi bi-printer me-2"></i>
                    Print Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showStatusModal && selectedInvoice && (
          <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-pencil-square me-2"></i>
                    Update Invoice Status
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowStatusModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmitStatusUpdate}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Invoice ID</label>
                      <input
                        type="text"
                        className="form-control"
                        value={`#${selectedInvoice.invoiceID}`}
                        disabled
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Patient Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedInvoice.patientName || 'N/A'}
                        disabled
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Amount</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formatCurrency(selectedInvoice.amount)}
                        disabled
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Current Status</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedInvoice.status}
                        disabled
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">New Status *</label>
                      <select
                        className="form-select"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        required
                      >
                        <option value="Generated">Generated</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowStatusModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-save me-2"></i>
                      Update Status
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
