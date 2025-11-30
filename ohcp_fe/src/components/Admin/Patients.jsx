import React, { useState, useEffect } from "react";
import NavbarAdmin from "./NavbarAdmin";
import { patientsApi, medicalRecordsApi } from "../../services/adminApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Admin.css";

export default function Patients() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [patients, setPatients] = useState([]);
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
    status: '',
    sortBy: 'newest'
  });

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHealthRecords, setPatientHealthRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    address: '',
    city: '',
    country: '',
    bloodType: '',
    occupation: '',
    preferredLanguage: '',
    preferredContactMethod: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    medicalHistorySummary: '',
    insuranceProvider: '',
    insurancePolicyNumber: ''
  });

  // Fetch patients from API
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientsApi.getAll({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        ...filters
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

  // Fetch data on component mount and when filters/pagination change
  useEffect(() => {
    fetchPatients();
  }, [pagination.pageNumber, filters]);

  // Handle search
  const handleSearch = (e) => {
    setFilters({ ...filters, searchTerm: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 }); // Reset to page 1
  };

  // Handle status filter
  const handleStatusFilter = (e) => {
    setFilters({ ...filters, status: e.target.value });
    setPagination({ ...pagination, pageNumber: 1 });
  };

  // Handle sort
  const handleSort = (e) => {
    setFilters({ ...filters, sortBy: e.target.value });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, pageNumber: newPage });
  };

  // Handle view patient details
  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
    setLoadingRecords(true);

    try {
      const records = await medicalRecordsApi.getByPatientId(patient.patientID);
      setPatientHealthRecords(records);
    } catch (err) {
      console.error('Error fetching health records:', err);
      setPatientHealthRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Handle edit patient
  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setEditForm({
      fullName: patient.fullName,
      phoneNumber: patient.phone,
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
      gender: patient.gender || '',
      email: patient.email || '',
      address: patient.address || '',
      city: patient.city || '',
      country: patient.country || '',
      bloodType: patient.bloodType || '',
      occupation: patient.occupation || '',
      preferredLanguage: patient.preferredLanguage || '',
      preferredContactMethod: patient.preferredContactMethod || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      emergencyContactRelationship: patient.emergencyContactRelationship || '',
      medicalHistorySummary: patient.medicalHistorySummary || '',
      insuranceProvider: patient.insuranceProvider || '',
      insurancePolicyNumber: patient.insurancePolicyNumber || ''
    });
    setShowEditModal(true);
  };

  // Handle update patient
  const handleUpdatePatient = async (e) => {
    e.preventDefault();

    try {
      // Prepare data according to UpdatePatientAdminDto (using PascalCase to match backend)
      const updateData = {
        FullName: editForm.fullName,
        PhoneNumber: editForm.phoneNumber,
        DateOfBirth: editForm.dateOfBirth,
        Gender: editForm.gender,
        Address: editForm.address,
        City: editForm.city,
        Country: editForm.country,
        BloodType: editForm.bloodType,
        Occupation: editForm.occupation,
        PreferredLanguage: editForm.preferredLanguage,
        PreferredContactMethod: editForm.preferredContactMethod,
        EmergencyContactName: editForm.emergencyContactName,
        EmergencyContactPhone: editForm.emergencyContactPhone,
        EmergencyContactRelationship: editForm.emergencyContactRelationship,
        MedicalHistorySummary: editForm.medicalHistorySummary,
        InsuranceProvider: editForm.insuranceProvider,
        InsurancePolicyNumber: editForm.insurancePolicyNumber
      };

      console.log('Sending update data:', updateData);
      console.log('Patient ID:', selectedPatient.patientID);

      const response = await patientsApi.update(selectedPatient.patientID, updateData);
      console.log('Update response:', response);

      alert('Patient updated successfully');
      setShowEditModal(false);
      fetchPatients();
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);

      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to update patient';
      alert(`Update failed: ${errorMessage}`);
    }
  };


  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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
            <h2 className="admin-page-title">Patients List</h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Search and Filter */}
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
                    setFilters({ searchTerm: '', status: '', sortBy: 'newest' });
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
                <div className="col-md-6" style={{padding:"0 0 10px 20px"}}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, phone..."
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-3" style={{padding:"0 20px 0 0"}}>
                  <select
                    className="form-select"
                    value={filters.sortBy}
                    onChange={handleSort}
                  >
                    <option value="newest">Sort by: Newest</option>
                    <option value="oldest">Sort by: Oldest</option>
                    <option value="name-asc">Sort by: Name A-Z</option>
                    <option value="name-desc">Sort by: Name Z-A</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Patients Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
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
                        <th>ID</th>
                        <th>Full Name</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Last Visit</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient) => (
                        <tr key={patient.patientID}>
                          <td><strong>{patient.patientID.substring(0, 8)}</strong></td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{width: "35px", height: "35px"}}>
                                {patient.fullName.charAt(0)}
                              </div>
                              {patient.fullName}
                            </div>
                          </td>
                          <td>{patient.age}</td>
                          <td>{patient.gender}</td>
                          <td>{patient.phone}</td>
                          <td>{patient.email}</td>
                          <td>{patient.lastVisit || 'N/A'}</td>
                          <td className="text-center">
                            <div className="admin-btn-group">
                              <button
                                className="btn btn-outline-slate btn-sm"
                                title="View Details & Health Records"
                                onClick={() => handleViewPatient(patient)}
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                className="btn btn-outline-info btn-sm"
                                title="Edit Patient Info"
                                onClick={() => handleEditPatient(patient)}
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
            {!loading && patients.length > 0 && (
              <div className="card-footer bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted" style={{fontSize: '13px'}}>
                    Page <strong style={{color: 'var(--admin-text)'}}>{pagination.pageNumber}</strong> of <strong style={{color: 'var(--admin-text)'}}>{pagination.totalPages}</strong> • <strong style={{color: 'var(--admin-text)'}}>{pagination.totalCount}</strong> total patients
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

          {/* View Patient Details Modal */}
          {showViewModal && selectedPatient && (
            <div className="modal show d-block admin-modal-backdrop" tabIndex="-1">
              <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content" style={{border: 'none', boxShadow: 'var(--shadow-lg)'}}>
                  <div className="modal-header admin-modal-header primary" style={{borderBottom: 'none'}}>
                    <h5 className="modal-title">
                      <i className="bi bi-person-circle me-2"></i>
                      Patient Details
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowViewModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body admin-modal-body" style={{backgroundColor: 'var(--admin-bg)'}}>
                    {/* Patient Header Card - Highlighted */}
                    <div className="admin-card mb-4" style={{
                      background: 'linear-gradient(135deg, var(--admin-primary-dark) 0%, var(--admin-primary) 100%)',
                      color: 'white',
                      padding: 'var(--spacing-lg)'
                    }}>
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                            fontWeight: '700',
                            border: '3px solid rgba(255, 255, 255, 0.3)'
                          }}>
                            {selectedPatient.fullName.charAt(0)}
                          </div>
                        </div>
                        <div className="col">
                          <h4 className="mb-1" style={{fontWeight: '700', fontSize: 'var(--font-size-2xl)'}}>
                            {selectedPatient.fullName}
                          </h4>
                          <div className="d-flex flex-wrap gap-3 mt-2" style={{fontSize: 'var(--font-size-sm)'}}>
                            <span style={{opacity: 0.9}}>
                              <i className="bi bi-person-badge me-1"></i>
                              ID: {selectedPatient.patientID}
                            </span>
                            <span style={{opacity: 0.9}}>
                              <i className="bi bi-telephone me-1"></i>
                              {selectedPatient.phone}
                            </span>
                            <span style={{opacity: 0.9}}>
                              <i className="bi bi-envelope me-1"></i>
                              {selectedPatient.email}
                            </span>
                          </div>
                        </div>
                        <div className="col-auto text-end">
                          <div className="d-flex flex-column gap-2">
                            <div style={{
                              background: 'rgba(255, 255, 255, 0.2)',
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-md)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '600'
                            }}>
                              <i className="bi bi-cake me-1"></i>
                              {selectedPatient.age} years old
                            </div>
                            {selectedPatient.gender && (
                              <div style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '600'
                              }}>
                                <i className="bi bi-gender-ambiguous me-1"></i>
                                {selectedPatient.gender}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      {/* Left Column */}
                      <div className="col-lg-6">
                        {/* Personal Information */}
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-person-circle"></i>
                            Additional Information
                          </h6>
                          <div className="row">
                            <div className="col-md-6">
                              <div className="admin-info-row">
                                <strong>Date of Birth:</strong>
                                <span>{formatDate(selectedPatient.dateOfBirth)}</span>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="admin-info-row">
                                <strong>Blood Type:</strong>
                                <span>{selectedPatient.bloodType || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="admin-info-row">
                            <strong>Occupation:</strong>
                            <span>{selectedPatient.occupation || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Address Information */}
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-geo-alt"></i>
                            Address Information
                          </h6>
                          <div className="admin-info-row">
                            <strong>Address:</strong>
                            <span>{selectedPatient.address || 'N/A'}</span>
                          </div>
                          <div className="row">
                            <div className="col-md-6">
                              <div className="admin-info-row">
                                <strong>City:</strong>
                                <span>{selectedPatient.city || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="admin-info-row">
                                <strong>Country:</strong>
                                <span>{selectedPatient.country || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-telephone-fill"></i>
                            Emergency Contact
                          </h6>
                          <div className="admin-info-row">
                            <strong>Contact Name:</strong>
                            <span>{selectedPatient.emergencyContactName || 'N/A'}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Contact Phone:</strong>
                            <span>{selectedPatient.emergencyContactPhone || 'N/A'}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Relationship:</strong>
                            <span>{selectedPatient.emergencyContactRelationship || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Preferences */}
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-gear"></i>
                            Preferences
                          </h6>
                          <div className="admin-info-row">
                            <strong>Preferred Language:</strong>
                            <span>{selectedPatient.preferredLanguage || 'N/A'}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Contact Method:</strong>
                            <span>{selectedPatient.preferredContactMethod || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="col-lg-6">
                        {/* Medical Information */}
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-heart-pulse"></i>
                            Medical Information
                          </h6>
                          <div className="admin-info-row">
                            <strong>Medical History:</strong>
                            <span style={{display: 'block', marginTop: 'var(--spacing-sm)'}}>
                              {selectedPatient.medicalHistorySummary || 'No medical history recorded'}
                            </span>
                          </div>
                        </div>

                        {/* Insurance Information */}
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-shield-check"></i>
                            Insurance Information
                          </h6>
                          <div className="admin-info-row">
                            <strong>Provider:</strong>
                            <span>{selectedPatient.insuranceProvider || 'N/A'}</span>
                          </div>
                          <div className="admin-info-row">
                            <strong>Policy Number:</strong>
                            <span>{selectedPatient.insurancePolicyNumber || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Health Records */}
                        <div className="admin-modal-section">
                          <h6 className="admin-modal-section-title primary">
                            <i className="bi bi-file-medical"></i>
                            Health Records
                            <span className="admin-badge primary ms-2">{patientHealthRecords.length} records</span>
                          </h6>
                          {loadingRecords ? (
                            <div className="admin-loading">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <p className="mt-2">Loading health records...</p>
                            </div>
                          ) : patientHealthRecords.length === 0 ? (
                            <div className="admin-empty-state">
                              <i className="bi bi-file-medical"></i>
                              <p className="mt-2">No health records found</p>
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <table className="admin-table table mb-0">
                                <thead>
                                  <tr>
                                    <th>Record ID</th>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Diagnosis</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {patientHealthRecords.map((record) => (
                                    <tr key={record.healthRecordID}>
                                      <td><strong>{record.healthRecordID}</strong></td>
                                      <td>{formatDate(record.date)}</td>
                                      <td>
                                        <span className="admin-badge primary">
                                          {record.category}
                                        </span>
                                      </td>
                                      <td>{record.diagnosis}</td>
                                      <td>
                                        <span className={`admin-badge ${record.status.toLowerCase() === 'active' ? 'success' : 'info'}`}>
                                          {record.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Patient Modal */}
          {showEditModal && selectedPatient && (
            <div className="modal show d-block admin-modal-backdrop" tabIndex="-1">
              <div className="modal-dialog modal-xl" style={{maxWidth: '95%'}}>
                <div className="modal-content" style={{border: 'none', boxShadow: 'var(--shadow-lg)'}}>
                  <div className="modal-header admin-modal-header info" style={{borderBottom: 'none'}}>
                    <h5 className="modal-title">
                      <i className="bi bi-pencil-square me-2"></i>
                      Edit Patient Information
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowEditModal(false)}
                    ></button>
                  </div>
                  <form onSubmit={handleUpdatePatient}>
                    <div className="modal-body admin-modal-body" style={{backgroundColor: 'var(--admin-bg)'}}>
                      <div className="row">
                        {/* Left Column */}
                        <div className="col-lg-6">
                          {/* Personal Information Section */}
                          <div className="admin-modal-section">
                            <h6 className="admin-modal-section-title info">
                              <i className="bi bi-person-circle"></i>
                              Personal Information
                            </h6>
                            <div className="mb-3">
                              <label className="admin-form-label">Full Name <span className="text-danger">*</span></label>
                              <input
                                type="text"
                                className="form-control admin-form-control"
                                value={editForm.fullName}
                                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                required
                              />
                            </div>
                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Email <span className="text-danger">*</span></label>
                                <input
                                  type="email"
                                  className="form-control admin-form-control"
                                  value={editForm.email}
                                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                  required
                                  readOnly
                                />
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Phone Number <span className="text-danger">*</span></label>
                                <input
                                  type="tel"
                                  className="form-control admin-form-control"
                                  value={editForm.phoneNumber}
                                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Date of Birth <span className="text-danger">*</span></label>
                                <input
                                  type="date"
                                  className="form-control admin-form-control"
                                  value={editForm.dateOfBirth}
                                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Gender <span className="text-danger">*</span></label>
                                <select
                                  className="form-select admin-form-control"
                                  value={editForm.gender}
                                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                  required
                                >
                                  <option value="">Select Gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Blood Type</label>
                                <select
                                  className="form-select admin-form-control"
                                  value={editForm.bloodType}
                                  onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })}
                                >
                                  <option value="">Select Blood Type</option>
                                  <option value="A+">A+</option>
                                  <option value="A-">A-</option>
                                  <option value="B+">B+</option>
                                  <option value="B-">B-</option>
                                  <option value="AB+">AB+</option>
                                  <option value="AB-">AB-</option>
                                  <option value="O+">O+</option>
                                  <option value="O-">O-</option>
                                </select>
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Occupation</label>
                                <input
                                  type="text"
                                  className="form-control admin-form-control"
                                  value={editForm.occupation}
                                  onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                                  placeholder="Enter occupation"
                                />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="admin-form-label">Address</label>
                              <input
                                type="text"
                                className="form-control admin-form-control"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                placeholder="Enter full address"
                              />
                            </div>
                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">City</label>
                                <input
                                  type="text"
                                  className="form-control admin-form-control"
                                  value={editForm.city}
                                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                  placeholder="Enter city"
                                />
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Country</label>
                                <input
                                  type="text"
                                  className="form-control admin-form-control"
                                  value={editForm.country}
                                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                  placeholder="Enter country"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Emergency Contact Section */}
                          <div className="admin-modal-section">
                            <h6 className="admin-modal-section-title info">
                              <i className="bi bi-telephone-fill"></i>
                              Emergency Contact
                            </h6>
                            <div className="mb-3">
                              <label className="admin-form-label">Contact Name</label>
                              <input
                                type="text"
                                className="form-control admin-form-control"
                                value={editForm.emergencyContactName}
                                onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                                placeholder="Enter contact name"
                              />
                            </div>
                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Contact Phone</label>
                                <input
                                  type="tel"
                                  className="form-control admin-form-control"
                                  value={editForm.emergencyContactPhone}
                                  onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                                  placeholder="Enter phone"
                                />
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Relationship</label>
                                <input
                                  type="text"
                                  className="form-control admin-form-control"
                                  value={editForm.emergencyContactRelationship}
                                  onChange={(e) => setEditForm({ ...editForm, emergencyContactRelationship: e.target.value })}
                                  placeholder="e.g., Spouse, Parent"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Preferences Section */}
                          <div className="admin-modal-section">
                            <h6 className="admin-modal-section-title info">
                              <i className="bi bi-gear"></i>
                              Preferences
                            </h6>
                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Preferred Language</label>
                                <input
                                  type="text"
                                  className="form-control admin-form-control"
                                  value={editForm.preferredLanguage}
                                  onChange={(e) => setEditForm({ ...editForm, preferredLanguage: e.target.value })}
                                  placeholder="e.g., English"
                                />
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="admin-form-label">Contact Method</label>
                                <select
                                  className="form-select admin-form-control"
                                  value={editForm.preferredContactMethod}
                                  onChange={(e) => setEditForm({ ...editForm, preferredContactMethod: e.target.value })}
                                >
                                  <option value="">Select Method</option>
                                  <option value="Email">Email</option>
                                  <option value="Phone">Phone</option>
                                  <option value="SMS">SMS</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="col-lg-6">
                          {/* Medical Information Section */}
                          <div className="admin-modal-section">
                            <h6 className="admin-modal-section-title info">
                              <i className="bi bi-heart-pulse"></i>
                              Medical Information
                            </h6>
                            <div className="mb-3">
                              <label className="admin-form-label">Medical History Summary</label>
                              <textarea
                                className="form-control admin-form-control"
                                rows="12"
                                value={editForm.medicalHistorySummary}
                                onChange={(e) => setEditForm({ ...editForm, medicalHistorySummary: e.target.value })}
                                placeholder="Enter medical history, allergies, chronic conditions..."
                              ></textarea>
                            </div>
                          </div>

                          {/* Insurance Information Section */}
                          <div className="admin-modal-section">
                            <h6 className="admin-modal-section-title info">
                              <i className="bi bi-shield-check"></i>
                              Insurance Information
                            </h6>
                            <div className="mb-3">
                              <label className="admin-form-label">Insurance Provider</label>
                              <input
                                type="text"
                                className="form-control admin-form-control"
                                value={editForm.insuranceProvider}
                                onChange={(e) => setEditForm({ ...editForm, insuranceProvider: e.target.value })}
                                placeholder="e.g., Blue Cross, Aetna"
                              />
                            </div>
                            <div className="mb-3">
                              <label className="admin-form-label">Insurance Policy Number</label>
                              <input
                                type="text"
                                className="form-control admin-form-control"
                                value={editForm.insurancePolicyNumber}
                                onChange={(e) => setEditForm({ ...editForm, insurancePolicyNumber: e.target.value })}
                                placeholder="Enter policy number"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="admin-modal-footer">
                      <button
                        type="button"
                        className="admin-btn-modal secondary"
                        onClick={() => setShowEditModal(false)}
                      >
                        <i className="bi bi-x-circle"></i>
                        Cancel
                      </button>
                      <button type="submit" className="admin-btn-modal success">
                        <i className="bi bi-check-circle"></i>
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
