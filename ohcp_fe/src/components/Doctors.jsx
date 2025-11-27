import React, { useState, useEffect } from 'react';
import { doctorService } from '../api/doctorApi';
import { useNavigate } from 'react-router-dom';
import './Css/Doctors.css';
import { useAuth } from '../context/AuthContext';
import { handleAuthenticatedAction } from '../utils/authUtils';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  // 2. State pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5, 
    totalPages: 1,
    totalItems: 0
  });

  // 3. State filters
  const [filters, setFilters] = useState({
    name: '',
    specialty: '',
    location: '',
    language: ''
  });

  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load when page changes
  useEffect(() => {
    loadDoctors();
  }, [pagination.page]);

  // Load when filters change (DEBOUNCE)
  useEffect(() => {
    // Timer
    const timer = setTimeout(() => {
      // Logic:
      // if page = 1 -> loadDoctors()
      // else -> Reset page to 1
      if (pagination.page === 1) {
        loadDoctors();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 800); // wait 800ms

    // Cleanup function: clear timer
    return () => clearTimeout(timer);
  }, [filters]); // Run again when 'filters' changes

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const params = { ...filters, page: pagination.page, pageSize: pagination.pageSize };

      const data = await doctorService.searchDoctors(params);

      // Option 1: Backend returns PagedResult standard
      if (data && data.items) {
        setDoctors(data.items);
        setPagination(prev => ({
          ...prev,
          totalPages: data.totalPages > 0 ? data.totalPages : 1, // Ensure at least 1
          totalItems: data.totalItems
        }));
      }
      // Option 2: Fallback (if backend has not updated yet)
      else if (Array.isArray(data)) {
        setDoctors(data);
        // If returns a regular list, no pagination
        setPagination(prev => ({ ...prev, totalPages: 1, totalItems: data.length }));
      }
      else {
        setDoctors([]);
        setPagination(prev => ({ ...prev, totalPages: 1, totalItems: 0 }));
      }
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
      setDoctors([]);
    }
    setLoading(false);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadDoctors();
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo(0, 0); // Scroll to top for better UX
    }
  };

  // Helper function to render stars
  const renderStars = (rating) => {
    const r = Math.round(rating);
    return <span className="text-warning">{"★".repeat(r)}{"☆".repeat(5 - r)}</span>;
  };

  return (
    <div className='Background_Doctors'>
      <div className="container">
        <div className="row" style={{ backgroundColor: "#ffffffa4", padding: "3%" }}>
          {/* --- SIDEBAR FILTER --- */}
          <div className="col-md-3 mb-4">
            <div className="card p-3 shadow-sm bg-light">
              <h5 className="mb-3"><i className="bi bi-funnel-fill"></i> Filter Doctors</h5>

              <div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Specialty</label>
                  <select name="specialty" className="form-select" onChange={handleFilterChange} value={filters.specialty}>
                    <option value="">All Specialties</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="General">General Practitioner</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Location</label>
                  <input
                    type="text" name="location" className="form-control"
                    placeholder="e.g. Hanoi..."
                    onChange={handleFilterChange}
                    value={filters.location}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Language</label>
                  <input
                    type="text" name="language" className="form-control"
                    placeholder="e.g. English..."
                    onChange={handleFilterChange}
                    value={filters.language}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Name</label>
                  <input
                    type="text" name="name" className="form-control"
                    placeholder="Doctor Name..."
                    onChange={handleFilterChange}
                    value={filters.name}
                  />
                </div>

                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={() => setFilters({ name: '', specialty: '', location: '', language: '' })}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* --- Doctor List --- */}
          <div className="col-md-9">
            <h3 className="mb-4">
              Available Doctors <span className="text-muted fs-6">({pagination.totalItems} results)</span>
            </h3>

            {loading ? <div className="text-center">Loading...</div> : (
              <>
                {doctors?.length === 0 ? (
                  <div className="alert alert-warning">No doctors found matching your criteria.</div>
                ) : (
                  doctors.map(doc => (
                    <div key={doc.doctorID} className="card mb-3 shadow-sm border-0">
                      <div className="card-body">
                        <div className="row align-items-center">
                          {/* Avatar */}
                          <div className="col-md-2 text-center">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto"
                              style={{ width: '70px', height: '70px', fontSize: '28px' }}>
                              {doc.fullName.charAt(0)}
                            </div>
                          </div>
                          {/* Info */}
                          <div className="col-md-7">
                            <h5 className="card-title text-primary mb-1">{doc.fullName}</h5>
                            <p className="text-muted mb-1 fw-bold">{doc.specialty}</p>
                            <div className="small text-secondary mb-2">
                              <span className="me-3">📍 {doc.location}</span>
                              <span className="me-3">🗣 {doc.languageSpoken}</span>
                              <span>💼 {doc.yearsOfExperience} years exp</span>
                            </div>
                            <div>
                              {renderStars(doc.averageRating)}
                              <span className="text-dark ms-2 small">({doc.totalReviews} reviews)</span>
                            </div>
                          </div>
                          {/* Buttons */}
                          <div className="col-md-3 text-end">
                            <button className="btn btn-outline-info w-100 mb-2" onClick={() => navigate(`/doctor/${doc.doctorID}`)}>
                              View Profile
                            </button>
                            <button
                              className="btn btn-success w-100"
                              onClick={() => handleAuthenticatedAction(isAuthenticated, navigate, `/book/${doc.doctorID}`)}
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* --- PAGINATION --- */}
                {pagination.totalPages > 1 && (
                  <nav className="d-flex justify-content-center mt-4">
                    <ul className="pagination">
                      <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(pagination.page - 1)}>
                          &laquo; Prev
                        </button>
                      </li>

                      {/* Array Page [1, 2, 3...] */}
                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <li key={i + 1} className={`page-item ${pagination.page === i + 1 ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                            {i + 1}
                          </button>
                        </li>
                      ))}

                      <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(pagination.page + 1)}>
                          Next &raquo;
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>

  );
};

export default Doctors;