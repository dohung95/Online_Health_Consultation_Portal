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
            <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      <i className="bi bi-person-circle me-2"></i>
                      Patient Details & Health Records
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowViewModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {/* Patient Information */}
                    <div className="card mb-3">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-person-circle me-2"></i>
                          Personal Information
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <strong>Full Name:</strong>
                            <p className="mb-0">{selectedPatient.fullName}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Patient ID:</strong>
                            <p className="mb-0">{selectedPatient.patientID}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Age:</strong>
                            <p className="mb-0">{selectedPatient.age} years</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Gender:</strong>
                            <p className="mb-0">{selectedPatient.gender || 'N/A'}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Phone:</strong>
                            <p className="mb-0">{selectedPatient.phone}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Email:</strong>
                            <p className="mb-0">{selectedPatient.email}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Date of Birth:</strong>
                            <p className="mb-0">{formatDate(selectedPatient.dateOfBirth)}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Blood Type:</strong>
                            <p className="mb-0">{selectedPatient.bloodType || 'N/A'}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Occupation:</strong>
                            <p className="mb-0">{selectedPatient.occupation || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="card mb-3">
                      <div className="card-header bg-secondary text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-geo-alt me-2"></i>
                          Address Information
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-12 mb-3">
                            <strong>Address:</strong>
                            <p className="mb-0">{selectedPatient.address || 'N/A'}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>City:</strong>
                            <p className="mb-0">{selectedPatient.city || 'N/A'}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Country:</strong>
                            <p className="mb-0">{selectedPatient.country || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="card mb-3">
                      <div className="card-header bg-danger text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-telephone-fill me-2"></i>
                          Emergency Contact
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <strong>Contact Name:</strong>
                            <p className="mb-0">{selectedPatient.emergencyContactName || 'N/A'}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Contact Phone:</strong>
                            <p className="mb-0">{selectedPatient.emergencyContactPhone || 'N/A'}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Relationship:</strong>
                            <p className="mb-0">{selectedPatient.emergencyContactRelationship || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="card mb-3">
                      <div className="card-header bg-info text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-gear me-2"></i>
                          Preferences
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <strong>Preferred Language:</strong>
                            <p className="mb-0">{selectedPatient.preferredLanguage || 'N/A'}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Preferred Contact Method:</strong>
                            <p className="mb-0">{selectedPatient.preferredContactMethod || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Medical & Insurance Information */}
                    <div className="card mb-3">
                      <div className="card-header bg-success text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-heart-pulse me-2"></i>
                          Medical & Insurance Information
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-12 mb-3">
                            <strong>Medical History Summary:</strong>
                            <p className="mb-0">{selectedPatient.medicalHistorySummary || 'No medical history recorded'}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Insurance Provider:</strong>
                            <p className="mb-0">{selectedPatient.insuranceProvider || 'N/A'}</p>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong>Insurance Policy Number:</strong>
                            <p className="mb-0">{selectedPatient.insurancePolicyNumber || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Health Records */}
                    <div className="card">
                      <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Health Records</h6>
                        <span className="badge bg-light text-dark">{patientHealthRecords.length} records</span>
                      </div>
                      <div className="card-body">
                        {loadingRecords ? (
                          <div className="text-center p-3">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading health records...</p>
                          </div>
                        ) : patientHealthRecords.length === 0 ? (
                          <div className="text-center p-3 text-muted">
                            <i className="bi bi-file-medical fs-1"></i>
                            <p className="mt-2">No health records found for this patient</p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover">
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
                                      <span className="badge bg-light text-dark border">
                                        {record.category}
                                      </span>
                                    </td>
                                    <td>{record.diagnosis}</td>
                                    <td>
                                      <span className={`badge bg-${record.status.toLowerCase() === 'active' ? 'success' : 'secondary'}`}>
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
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowViewModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Patient Modal */}
          {showEditModal && selectedPatient && (
            <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
              <div className="modal-dialog modal-xl" style={{maxWidth: '90%'}}>
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
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
                    <div className="modal-body" style={{maxHeight: '75vh', overflowY: 'auto'}}>
                      <div className="row">
                        {/* Left Column - Personal Information */}
                        <div className="col-lg-6">
                          <div className="mb-4">
                            <h6 className="text-primary border-bottom pb-2 mb-3">
                              <i className="bi bi-person-circle me-2"></i>
                              Personal Information
                            </h6>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                              <input
                                type="text"
                                className="form-control"
                                value={editForm.fullName}
                                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                              <input
                                type="email"
                                className="form-control"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Phone Number <span className="text-danger">*</span></label>
                              <input
                                type="tel"
                                className="form-control"
                                value={editForm.phoneNumber}
                                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Date of Birth <span className="text-danger">*</span></label>
                              <input
                                type="date"
                                className="form-control"
                                value={editForm.dateOfBirth}
                                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Gender <span className="text-danger">*</span></label>
                              <select
                                className="form-select"
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
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Address</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                placeholder="Enter full address"
                              />
                            </div>
                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">City</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editForm.city}
                                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                  placeholder="Enter city"
                                />
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">Country</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editForm.country}
                                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                  placeholder="Enter country"
                                />
                              </div>
                            </div>
                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">Blood Type</label>
                                <select
                                  className="form-select"
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
                                <label className="form-label fw-semibold">Occupation</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={editForm.occupation}
                                  onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                                  placeholder="Enter occupation"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Emergency Contact Section */}
                          <div className="mb-4">
                            <h6 className="text-danger border-bottom pb-2 mb-3">
                              <i className="bi bi-telephone-fill me-2"></i>
                              Emergency Contact
                            </h6>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Contact Name</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editForm.emergencyContactName}
                                onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                                placeholder="Enter emergency contact name"
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Contact Phone</label>
                              <input
                                type="tel"
                                className="form-control"
                                value={editForm.emergencyContactPhone}
                                onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                                placeholder="Enter emergency contact phone"
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Relationship</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editForm.emergencyContactRelationship}
                                onChange={(e) => setEditForm({ ...editForm, emergencyContactRelationship: e.target.value })}
                                placeholder="e.g., Spouse, Parent, Sibling"
                              />
                            </div>
                          </div>

                          {/* Preferences Section */}
                          <div className="mb-4">
                            <h6 className="text-info border-bottom pb-2 mb-3">
                              <i className="bi bi-gear me-2"></i>
                              Preferences
                            </h6>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Preferred Language</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editForm.preferredLanguage}
                                onChange={(e) => setEditForm({ ...editForm, preferredLanguage: e.target.value })}
                                placeholder="e.g., English, Vietnamese"
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Preferred Contact Method</label>
                              <select
                                className="form-select"
                                value={editForm.preferredContactMethod}
                                onChange={(e) => setEditForm({ ...editForm, preferredContactMethod: e.target.value })}
                              >
                                <option value="">Select Contact Method</option>
                                <option value="Email">Email</option>
                                <option value="Phone">Phone</option>
                                <option value="SMS">SMS</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Medical & Insurance Information */}
                        <div className="col-lg-6">
                          {/* Medical Information Section */}
                          <div className="mb-4">
                            <h6 className="text-success border-bottom pb-2 mb-3">
                              <i className="bi bi-heart-pulse me-2"></i>
                              Medical Information
                            </h6>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Medical History Summary</label>
                              <textarea
                                className="form-control"
                                rows="8"
                                value={editForm.medicalHistorySummary}
                                onChange={(e) => setEditForm({ ...editForm, medicalHistorySummary: e.target.value })}
                                placeholder="Enter medical history, allergies, chronic conditions..."
                              ></textarea>
                            </div>
                          </div>

                          {/* Insurance Information Section */}
                          <div className="mb-4">
                            <h6 className="text-warning border-bottom pb-2 mb-3">
                              <i className="bi bi-shield-check me-2"></i>
                              Insurance Information
                            </h6>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Insurance Provider</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editForm.insuranceProvider}
                                onChange={(e) => setEditForm({ ...editForm, insuranceProvider: e.target.value })}
                                placeholder="e.g., Blue Cross, Aetna"
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Insurance Policy Number</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editForm.insurancePolicyNumber}
                                onChange={(e) => setEditForm({ ...editForm, insurancePolicyNumber: e.target.value })}
                                placeholder="Enter policy number"
                              />
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
                      <button type="submit" className="btn btn-primary">
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
