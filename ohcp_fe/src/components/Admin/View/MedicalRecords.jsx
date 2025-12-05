import React, { useState, useEffect } from "react";
import NavbarAdmin from "./NavbarAdmin";
import { medicalRecordsApi } from "../../../services/adminApi";
import Toast from "./Toast";
import useToast from "../useToast";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Css/Admin.css";

const API_BASE_URL = 'https://localhost:7267';

export default function MedicalRecords() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState(null);
  const [documentTextContent, setDocumentTextContent] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Fetch patient list
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await medicalRecordsApi.getPatients({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        searchTerm: searchTerm
      });

      setPatients(response.patients);
      setPagination({
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch patients');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient medical history
  const fetchPatientHistory = async (patientId) => {
    try {
      setLoading(true);
      const history = await medicalRecordsApi.getPatientMedicalHistory(patientId);
      setPatientHistory(history);
      setSelectedCategory('all');
    } catch (err) {
      showToast({
        title: 'Error',
        message: err.response?.data?.error || 'Failed to fetch patient history',
        type: 'error'
      });
      console.error('Error fetching patient history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPatient) {
      fetchPatients();
    }
  }, [pagination.pageNumber, searchTerm, selectedPatient]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination({ ...pagination, pageNumber: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, pageNumber: newPage });
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    fetchPatientHistory(patient.patientID);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setPatientHistory(null);
    setSelectedCategory('all');
  };

  const handleViewDocument = async (document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
    setDocumentPreviewUrl(null);
    setDocumentTextContent(null);

    // Fetch document with authentication for preview if it's a previewable type
    if (isPreviewable(document.documentType)) {
      await fetchDocumentPreview(document.documentID, document.documentType);
    }
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const fetchDocumentPreview = async (documentId, documentType) => {
    try {
      setLoadingDocument(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/MedicalDocument/file/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load document');
      }

      const type = documentType?.toLowerCase() || '';

      // Handle text files differently
      if (type.includes('text') || type.includes('txt')) {
        const text = await response.text();
        setDocumentTextContent(text);
      } else {
        // Handle images and PDFs as blobs
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setDocumentPreviewUrl(url);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      showToast({
        title: 'Error',
        message: 'Failed to load document preview',
        type: 'error'
      });
    } finally {
      setLoadingDocument(false);
    }
  };

  // Cleanup blob URL when modal closes
  useEffect(() => {
    return () => {
      if (documentPreviewUrl) {
        URL.revokeObjectURL(documentPreviewUrl);
      }
    };
  }, [documentPreviewUrl]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (documentType) => {
    const type = documentType?.toLowerCase() || '';
    if (type.includes('pdf')) return 'bi-file-pdf text-danger';
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg') || type.includes('gif') || type.includes('bmp')) return 'bi-file-image text-primary';
    if (type.includes('doc') || type.includes('word')) return 'bi-file-word text-info';
    if (type.includes('xls') || type.includes('excel') || type.includes('spreadsheet')) return 'bi-file-excel text-success';
    if (type.includes('ppt') || type.includes('powerpoint') || type.includes('presentation')) return 'bi-file-ppt text-warning';
    if (type.includes('txt') || type.includes('text')) return 'bi-file-text text-secondary';
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'bi-file-zip text-dark';
    if (type.includes('video') || type.includes('mp4') || type.includes('avi') || type.includes('mov')) return 'bi-file-play text-primary';
    if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) return 'bi-file-music text-info';
    return 'bi-file-earmark text-secondary';
  };

  // Check if file type is previewable
  const isPreviewable = (documentType) => {
    const type = documentType?.toLowerCase() || '';
    return type.includes('image') || type.includes('jpg') || type.includes('png') ||
      type.includes('jpeg') || type.includes('gif') || type.includes('bmp') ||
      type.includes('pdf') || type.includes('text') || type.includes('txt') ||
      type.includes('video') || type.includes('mp4') || type.includes('avi') ||
      type.includes('mov') || type.includes('webm') || type.includes('mkv') ||
      type.includes('audio') || type.includes('mp3') || type.includes('wav') ||
      type.includes('ogg') || type.includes('m4a');
  };

  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('x-ray') || cat.includes('imaging')) return 'bi-x-ray';
    if (cat.includes('lab') || cat.includes('blood')) return 'bi-droplet';
    if (cat.includes('prescription')) return 'bi-prescription2';
    if (cat.includes('ct') || cat.includes('mri')) return 'bi-hospital';
    if (cat.includes('consultation')) return 'bi-chat-left-text';
    return 'bi-folder';
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-success';
      case 'scheduled':
        return 'bg-primary';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  // Filter documents by category
  const getFilteredDocuments = () => {
    if (!patientHistory?.documentsByCategory) return [];
    if (selectedCategory === 'all') return patientHistory.documentsByCategory;
    return patientHistory.documentsByCategory.filter(cat => cat.category === selectedCategory);
  };

  // Get document file URL
  const getDocumentFileUrl = (documentId) => {
    return `${API_BASE_URL}/api/MedicalDocument/file/${documentId}`;
  };

  // Handle document download with authentication
  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/MedicalDocument/file/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      showToast({
        title: 'Error',
        message: 'Failed to download document',
        type: 'error'
      });
    }
  };

  return (
    <NavbarAdmin
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <main className="admin-content p-4">
        {toast.show && (
          <Toast
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}

        {!selectedPatient ? (
          // PATIENT LIST VIEW
          <>
            <div className="admin-page-header-doctors mb-4">
              <div className="d-flex justify-content-between align-items-start">
                <div className="admin-page-title-section">
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="admin-page-icon-doctors">
                      <i className="bi bi-file-medical-fill"></i>
                    </div>
                    <div>
                      <h2 className="admin-page-title mb-1">
                        Medical Records - Patient View
                      </h2>
                      <div className="d-flex align-items-center gap-2">
                        <span className="admin-page-badge-doctors">
                          <i className="bi bi-people-fill me-1"></i>
                          Patient-Centric Records
                        </span>
                        <span className="admin-page-count">
                          {pagination.totalCount} {pagination.totalCount === 1 ? 'Patient' : 'Patients'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="admin-page-subtitle-doctors mb-0">
                    View comprehensive medical history organized by patient
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {/* Search */}
            <div className="admin-card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center" style={{ padding: "5px 10px" }}>
                    <i className="bi bi-search me-2" style={{ color: 'var(--admin-text-light)' }}></i>
                    <h6 className="mb-0" style={{ color: 'var(--admin-text-light)', fontSize: '13px', fontWeight: 600 }}>SEARCH PATIENTS</h6>
                  </div>
                  <div style={{ padding: "15px 5px 0 5px" }}>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setSearchTerm('');
                        setPagination({ ...pagination, pageNumber: 1 });
                      }}
                      style={{ fontSize: '12px' }}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Clear
                    </button>
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-md-12" style={{ padding: "0 20px 10px 20px" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by patient name, ID, or email..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Patient List Table */}
            <div className="admin-card">
              <div className="card-body p-0">
                {loading ? (
                  <div className="admin-loading">
                    <div className="spinner-border" style={{ color: 'var(--admin-primary)' }} role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading patients...</p>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="admin-empty-state">
                    <i className="bi bi-inbox"></i>
                    <p className="mt-2">No patients found</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="admin-table table mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Patient ID</th>
                          <th>Full Name</th>
                          <th>Email</th>
                          <th>Gender</th>
                          <th>Date of Birth</th>
                          <th>Total Records</th>
                          <th>Total Documents</th>
                          <th>Last Updated</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map((patient) => (
                          <tr key={patient.patientID}>
                            <td><strong>{patient.patientID.substring(0, 8)}</strong></td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center me-2" style={{ width: "35px", height: "35px" }}>
                                  {patient.fullName.charAt(0)}
                                </div>
                                {patient.fullName}
                              </div>
                            </td>
                            <td>{patient.email}</td>
                            <td>{patient.gender || 'N/A'}</td>
                            <td>{formatDate(patient.dateOfBirth)}</td>
                            <td>
                              <span className="badge bg-primary">{patient.totalRecords}</span>
                            </td>
                            <td>
                              <span className="badge bg-success">{patient.totalDocuments}</span>
                            </td>
                            <td>{formatDate(patient.lastUpdated)}</td>
                            <td className="text-center">
                              <button
                                className="btn btn-outline-slate btn-sm"
                                title="View Medical History"
                                onClick={() => handleViewPatient(patient)}
                              >
                                <i className="bi bi-eye"></i> View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {!loading && patients.length > 0 && (
                <div className="card-footer bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted" style={{ fontSize: '13px' }}>
                      Page <strong style={{ color: 'var(--admin-text)' }}>{pagination.pageNumber}</strong> of <strong style={{ color: 'var(--admin-text)' }}>{pagination.totalPages}</strong> • <strong style={{ color: 'var(--admin-text)' }}>{pagination.totalCount}</strong> total patients
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
                            if (currentPage > 3) pageNumbers.push('...');
                            const start = Math.max(2, currentPage - 1);
                            const end = Math.min(totalPages - 1, currentPage + 1);
                            for (let i = start; i <= end; i++) {
                              if (!pageNumbers.includes(i)) pageNumbers.push(i);
                            }
                            if (currentPage < totalPages - 2) pageNumbers.push('...');
                            if (!pageNumbers.includes(totalPages)) pageNumbers.push(totalPages);
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
          </>
        ) : (
          // PATIENT DETAIL VIEW
          <>
            {loading ? (
              <div className="admin-loading">
                <div className="spinner-border" style={{ color: 'var(--admin-primary)' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading patient medical history...</p>
              </div>
            ) : patientHistory && (
              <>
                {/* Back Button */}
                <div className="mb-3">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleBackToList}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Patient List
                  </button>
                </div>

                {/* Patient Header */}
                <div className="admin-card mb-4" style={{
                  background: 'linear-gradient(135deg, var(--admin-primary-dark) 0%, var(--admin-primary) 100%)',
                  color: 'white',
                  padding: 'var(--spacing-lg)'
                }}>
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center" style={{ width: "60px", height: "60px", fontSize: "24px", fontWeight: "bold" }}>
                          {patientHistory.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="mb-1" style={{ fontWeight: '700' }}>{patientHistory.fullName}</h3>
                          <p className="mb-0" style={{ opacity: 0.9 }}>Patient ID: {patientHistory.patientID}</p>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>Email</div>
                          <div style={{ fontWeight: '600' }}>{patientHistory.email}</div>
                        </div>
                        <div className="col-md-6">
                          <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>Phone</div>
                          <div style={{ fontWeight: '600' }}>{patientHistory.phoneNumber || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="row">
                        <div className="col-6">
                          <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>Gender</div>
                          <div style={{ fontWeight: '600' }}>{patientHistory.gender || 'N/A'}</div>
                        </div>
                        <div className="col-6">
                          <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>Blood Type</div>
                          <div style={{ fontWeight: '600' }}>{patientHistory.bloodType || 'N/A'}</div>
                        </div>
                        <div className="col-12 mt-2">
                          <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>Date of Birth</div>
                          <div style={{ fontWeight: '600' }}>{formatDate(patientHistory.dateOfBirth)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {patientHistory.medicalHistorySummary && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>Medical History Summary</div>
                      <div style={{ fontWeight: '500' }}>{patientHistory.medicalHistorySummary}</div>
                    </div>
                  )}
                </div>

                <div className="row">
                  {/* Left Column - Appointment History */}
                  <div className="col-md-6">
                    <div className="admin-card mb-4">
                      <div className="card-body">
                        <h5 className="mb-3">
                          <i className="bi bi-calendar-check me-2 text-primary"></i>
                          Appointment History
                        </h5>
                        {patientHistory.appointments && patientHistory.appointments.length > 0 ? (
                          <div className="timeline">
                            {patientHistory.appointments.map((appointment, index) => (
                              <div
                                key={appointment.appointmentID}
                                className="timeline-item mb-3"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleViewAppointment(appointment)}
                              >
                                <div className="d-flex gap-3">
                                  <div className="timeline-marker">
                                    <div className={`rounded-circle ${getStatusBadgeClass(appointment.status)} text-white d-flex align-items-center justify-content-center`} style={{ width: "40px", height: "40px" }}>
                                      <i className="bi bi-calendar-event"></i>
                                    </div>
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <div>
                                        <h6 className="mb-1">{formatDateTime(appointment.appointmentTime)}</h6>
                                        <p className="mb-0 text-muted" style={{ fontSize: '13px' }}>
                                          <i className="bi bi-person-badge me-1"></i>
                                          Dr. {appointment.doctorName} - {appointment.doctorSpecialty}
                                        </p>
                                      </div>
                                      <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                                        {appointment.status}
                                      </span>
                                    </div>
                                    <p className="mb-0" style={{ fontSize: '13px' }}>
                                      <i className="bi bi-clipboard-pulse me-1"></i>
                                      {appointment.consultationType}
                                    </p>
                                    <p className="mb-0 mt-1" style={{ fontSize: '12px', color: '#6c757d' }}>
                                      <i className="bi bi-hand-index me-1"></i>
                                      Click to view details
                                    </p>
                                  </div>
                                </div>
                                {index < patientHistory.appointments.length - 1 && (
                                  <div className="timeline-line"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted py-4">
                            <i className="bi bi-calendar-x" style={{ fontSize: '48px' }}></i>
                            <p className="mt-2">No appointment history</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Medical Documents */}
                  <div className="col-md-6">
                    <div className="admin-card mb-4">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0">
                            <i className="bi bi-folder2-open me-2 text-success"></i>
                            Medical Documents
                          </h5>
                          <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                          >
                            <option value="all">All Categories</option>
                            {patientHistory.documentsByCategory && patientHistory.documentsByCategory.map((cat) => (
                              <option key={cat.category} value={cat.category}>
                                {cat.category} ({cat.documentCount})
                              </option>
                            ))}
                          </select>
                        </div>

                        {patientHistory.documentsByCategory && patientHistory.documentsByCategory.length > 0 ? (
                          <div className="accordion" id="documentAccordion">
                            {getFilteredDocuments().map((category, catIndex) => (
                              <div className="accordion-item" key={category.category}>
                                <h2 className="accordion-header">
                                  <button
                                    className={`accordion-button ${catIndex !== 0 ? 'collapsed' : ''}`}
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target={`#collapse${catIndex}`}
                                    aria-expanded={catIndex === 0}
                                  >
                                    <i className={`bi ${getCategoryIcon(category.category)} me-2`}></i>
                                    {category.category}
                                    <span className="badge bg-primary ms-2">{category.documentCount}</span>
                                  </button>
                                </h2>
                                <div
                                  id={`collapse${catIndex}`}
                                  className={`accordion-collapse collapse ${catIndex === 0 ? 'show' : ''}`}
                                  data-bs-parent="#documentAccordion"
                                >
                                  <div className="accordion-body">
                                    <div className="list-group list-group-flush">
                                      {category.documents.map((doc) => (
                                        <div
                                          key={doc.documentID}
                                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                          style={{ cursor: 'pointer' }}
                                          onClick={() => handleViewDocument(doc)}
                                        >
                                          <div className="d-flex align-items-start gap-2 flex-grow-1">
                                            <i className={`${getFileIcon(doc.documentType)} fs-4`}></i>
                                            <div className="flex-grow-1">
                                              <h6 className="mb-1">{doc.documentName}</h6>
                                              {doc.description && (
                                                <p className="mb-1 text-muted" style={{ fontSize: '12px' }}>{doc.description}</p>
                                              )}
                                              <div className="d-flex gap-3" style={{ fontSize: '11px', color: '#6c757d' }}>
                                                {doc.documentDate && (
                                                  <span><i className="bi bi-calendar3 me-1"></i>{formatDate(doc.documentDate)}</span>
                                                )}
                                                {doc.performedBy && (
                                                  <span><i className="bi bi-person me-1"></i>{doc.performedBy}</span>
                                                )}
                                                <span><i className="bi bi-upload me-1"></i>{formatDate(doc.uploadedAt)}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <i className="bi bi-chevron-right"></i>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted py-4">
                            <i className="bi bi-file-earmark-x" style={{ fontSize: '48px' }}></i>
                            <p className="mt-2">No medical documents</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Document Viewer Modal */}
        {showDocumentModal && selectedDocument && (
          <div className="modal show d-block admin-modal-backdrop" tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content" style={{ border: 'none', boxShadow: 'var(--shadow-lg)' }}>
                <div className="modal-header admin-modal-header primary" style={{ borderBottom: 'none' }}>
                  <h5 className="modal-title">
                    <i className={`${getFileIcon(selectedDocument.documentType)} me-2`}></i>
                    {selectedDocument.documentName}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowDocumentModal(false)}
                  ></button>
                </div>
                <div className="modal-body admin-modal-body" style={{ backgroundColor: 'var(--admin-bg)' }}>
                  {/* Document Metadata */}
                  <div className="admin-card mb-3">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="admin-info-row">
                            <strong>Category:</strong>
                            <span>{selectedDocument.category || 'N/A'}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Document Type:</strong>
                            <span>{selectedDocument.documentType}</span>
                          </div>
                          {selectedDocument.documentDate && (
                            <div className="admin-info-row">
                              <strong>Document Date:</strong>
                              <span>{formatDate(selectedDocument.documentDate)}</span>
                            </div>
                          )}
                        </div>
                        <div className="col-md-6">
                          {selectedDocument.performedBy && (
                            <div className="admin-info-row">
                              <strong>Performed By:</strong>
                              <span>{selectedDocument.performedBy}</span>
                            </div>
                          )}
                          <div className="admin-info-row">
                            <strong>Uploaded:</strong>
                            <span>{formatDateTime(selectedDocument.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>
                      {selectedDocument.description && (
                        <div className="admin-info-row mt-2">
                          <strong>Description:</strong>
                          <span style={{ display: 'block', marginTop: '5px' }}>{selectedDocument.description}</span>
                        </div>
                      )}
                      {selectedDocument.testResults && (
                        <div className="admin-info-row mt-2">
                          <strong>Test Results:</strong>
                          <span style={{ display: 'block', marginTop: '5px' }}>{selectedDocument.testResults}</span>
                        </div>
                      )}
                      {selectedDocument.referenceRange && (
                        <div className="admin-info-row mt-2">
                          <strong>Reference Range:</strong>
                          <span>{selectedDocument.referenceRange}</span>
                        </div>
                      )}
                      {selectedDocument.testStatus && (
                        <div className="admin-info-row mt-2">
                          <strong>Test Status:</strong>
                          <span className={`badge ${selectedDocument.testStatus.toLowerCase() === 'normal' ? 'bg-success' :
                            selectedDocument.testStatus.toLowerCase() === 'abnormal' ? 'bg-warning' :
                              selectedDocument.testStatus.toLowerCase() === 'critical' ? 'bg-danger' : 'bg-secondary'
                            }`}>{selectedDocument.testStatus}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Preview */}
                  <div className="admin-card">
                    <div className="card-body text-center">
                      {loadingDocument ? (
                        <div className="py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-3 text-muted">Loading document preview...</p>
                        </div>
                      ) : (() => {
                        const type = selectedDocument.documentType?.toLowerCase() || '';

                        // Image preview
                        if (type.includes('image') || type.includes('jpg') || type.includes('png') ||
                          type.includes('jpeg') || type.includes('gif') || type.includes('bmp')) {
                          return documentPreviewUrl ? (
                            <img
                              src={documentPreviewUrl}
                              alt={selectedDocument.documentName}
                              style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
                            />
                          ) : (
                            <div className="text-muted py-5">
                              <i className="bi bi-exclamation-triangle" style={{ fontSize: '64px', color: '#dc3545' }}></i>
                              <p className="mt-3">Unable to load image preview</p>
                              <p className="text-muted small">The image may be corrupted or in an unsupported format</p>
                            </div>
                          );
                        }

                        // PDF preview
                        if (type.includes('pdf')) {
                          return documentPreviewUrl ? (
                            <iframe
                              src={documentPreviewUrl}
                              style={{ width: '100%', height: '600px', border: 'none' }}
                              title={selectedDocument.documentName}
                            />
                          ) : (
                            <div className="text-muted py-5">
                              <i className="bi bi-exclamation-triangle" style={{ fontSize: '64px', color: '#dc3545' }}></i>
                              <p className="mt-3">Unable to load PDF preview</p>
                              <p className="text-muted small">Please download the file to view it</p>
                            </div>
                          );
                        }

                        // Text file preview
                        if (type.includes('text') || type.includes('txt')) {
                          return documentTextContent ? (
                            <div style={{
                              textAlign: 'left',
                              maxHeight: '600px',
                              overflowY: 'auto',
                              backgroundColor: '#f8f9fa',
                              padding: '20px',
                              borderRadius: '8px',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}>
                              {documentTextContent}
                            </div>
                          ) : (
                            <div className="text-muted py-5">
                              <i className="bi bi-exclamation-triangle" style={{ fontSize: '64px', color: '#dc3545' }}></i>
                              <p className="mt-3">Unable to load text preview</p>
                              <p className="text-muted small">The file may be empty or corrupted</p>
                            </div>
                          );
                        }

                        // Video preview
                        if (type.includes('video') || type.includes('mp4') || type.includes('avi') ||
                          type.includes('mov') || type.includes('webm') || type.includes('mkv')) {
                          return documentPreviewUrl ? (
                            <video
                              controls
                              style={{ maxWidth: '100%', maxHeight: '600px' }}
                              preload="metadata"
                            >
                              <source src={documentPreviewUrl} type={selectedDocument.documentType || 'video/mp4'} />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <div className="text-muted py-5">
                              <i className="bi bi-exclamation-triangle" style={{ fontSize: '64px', color: '#dc3545' }}></i>
                              <p className="mt-3">Unable to load video preview</p>
                              <p className="text-muted small">Please download the file to view it</p>
                            </div>
                          );
                        }

                        // Audio preview
                        if (type.includes('audio') || type.includes('mp3') || type.includes('wav') ||
                          type.includes('ogg') || type.includes('m4a')) {
                          return documentPreviewUrl ? (
                            <div className="py-5">
                              <i className="bi bi-file-music text-info" style={{ fontSize: '64px' }}></i>
                              <h5 className="mt-3 mb-4">{selectedDocument.documentName}</h5>
                              <audio
                                controls
                                style={{ width: '100%', maxWidth: '500px' }}
                                preload="metadata"
                              >
                                <source src={documentPreviewUrl} type={selectedDocument.documentType || 'audio/mpeg'} />
                                Your browser does not support the audio tag.
                              </audio>
                            </div>
                          ) : (
                            <div className="text-muted py-5">
                              <i className="bi bi-exclamation-triangle" style={{ fontSize: '64px', color: '#dc3545' }}></i>
                              <p className="mt-3">Unable to load audio preview</p>
                              <p className="text-muted small">Please download the file to view it</p>
                            </div>
                          );
                        }

                        // Unsupported file type - show download option
                        return (
                          <div className="text-muted py-5">
                            <i className={`${getFileIcon(selectedDocument.documentType)} fs-1 mb-3`}></i>
                            <h5 className="mt-3">{selectedDocument.documentName}</h5>
                            <p className="text-muted">Preview not available for this file type</p>
                            <p className="text-muted small mb-3">
                              File Type: <strong>{selectedDocument.documentType || 'Unknown'}</strong>
                            </p>
                            <button
                              onClick={() => handleDownloadDocument(selectedDocument.documentID, selectedDocument.documentName)}
                              className="btn btn-primary mt-2"
                            >
                              <i className="bi bi-download me-2"></i>
                              Download File to View
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button
                    onClick={() => handleDownloadDocument(selectedDocument.documentID, selectedDocument.documentName)}
                    className="admin-btn-modal primary"
                  >
                    <i className="bi bi-download"></i>
                    Download
                  </button>
                  <button
                    type="button"
                    className="admin-btn-modal secondary"
                    onClick={() => setShowDocumentModal(false)}
                  >
                    <i className="bi bi-x-circle"></i>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Detail Modal */}
        {showAppointmentModal && selectedAppointment && (
          <div className="modal show d-block admin-modal-backdrop" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content" style={{ border: 'none', boxShadow: 'var(--shadow-lg)' }}>
                <div className="modal-header admin-modal-header primary" style={{ borderBottom: 'none' }}>
                  <h5 className="modal-title">
                    <i className="bi bi-calendar-event me-2"></i>
                    Appointment Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowAppointmentModal(false)}
                  ></button>
                </div>
                <div className="modal-body admin-modal-body" style={{ backgroundColor: 'var(--admin-bg)' }}>
                  {/* Appointment Overview */}
                  <div className="admin-card mb-3">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="admin-info-row">
                            <strong>Appointment ID:</strong>
                            <span>#{selectedAppointment.appointmentID}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Date & Time:</strong>
                            <span>{formatDateTime(selectedAppointment.appointmentTime)}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Consultation Type:</strong>
                            <span className="badge bg-info">{selectedAppointment.consultationType}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Status:</strong>
                            <span className={`badge ${getStatusBadgeClass(selectedAppointment.status)}`}>
                              {selectedAppointment.status}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="admin-info-row">
                            <strong>Doctor:</strong>
                            <span>Dr. {selectedAppointment.doctorName}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Specialty:</strong>
                            <span>{selectedAppointment.doctorSpecialty}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Doctor ID:</strong>
                            <span className="text-muted" style={{ fontSize: '12px' }}>
                              {selectedAppointment.doctorID.substring(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Information */}
                  {patientHistory && (
                    <div className="admin-card mb-3">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="bi bi-person me-2 text-primary"></i>
                          Patient Information
                        </h6>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="admin-info-row">
                              <strong>Name:</strong>
                              <span>{patientHistory.fullName}</span>
                            </div>
                            <div className="admin-info-row">
                              <strong>Email:</strong>
                              <span>{patientHistory.email}</span>
                            </div>
                            <div className="admin-info-row">
                              <strong>Phone:</strong>
                              <span>{patientHistory.phoneNumber || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="admin-info-row">
                              <strong>Gender:</strong>
                              <span>{patientHistory.gender || 'N/A'}</span>
                            </div>
                            <div className="admin-info-row">
                              <strong>Blood Type:</strong>
                              <span>{patientHistory.bloodType || 'N/A'}</span>
                            </div>
                            <div className="admin-info-row">
                              <strong>Date of Birth:</strong>
                              <span>{formatDate(patientHistory.dateOfBirth)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className="admin-card">
                    <div className="card-body">
                      <h6 className="mb-3">
                        <i className="bi bi-info-circle me-2 text-success"></i>
                        Additional Information
                      </h6>
                      <div className="alert alert-info mb-0">
                        <i className="bi bi-lightbulb me-2"></i>
                        <strong>Consultation Type:</strong> {selectedAppointment.consultationType}
                        <br />
                        <small className="text-muted">
                          This appointment is scheduled for {selectedAppointment.consultationType.toLowerCase()} consultation.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-modal secondary"
                    onClick={() => setShowAppointmentModal(false)}
                  >
                    <i className="bi bi-x-circle"></i>
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
