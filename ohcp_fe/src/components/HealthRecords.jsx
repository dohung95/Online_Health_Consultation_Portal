import React, { useEffect, useState } from 'react';
import { healthRecordApi } from '../api/healthRecordApi';
import DocumentViewerModal from './DocumentViewerModal';
import { appointmentService } from '../api/appointmentApi';
import "../components/Css/HealthRecords.css"

const HealthRecords = () => {
    // State for Documents
    const [records, setRecords] = useState([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [files, setFiles] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    // State for Medical History
    const [history, setHistory] = useState("");
    const [isEditingHistory, setIsEditingHistory] = useState(false);
    const [tempHistory, setTempHistory] = useState("");
    const [historyView, setHistoryView] = useState('summary');
    const [medicalHistory, setMedicalHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [itemsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

    // States for upload form
    const [documentCategory, setDocumentCategory] = useState('');
    const [description, setDescription] = useState('');
    const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
    const [testResults, setTestResults] = useState('');
    const [referenceRange, setReferenceRange] = useState('');
    const [testStatus, setTestStatus] = useState('Normal');
    // States for filters & search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [showViewer, setShowViewer] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingDocs(true);
        setLoadingHistory(true);
        try {
            const [docsData, profileData, historyData] = await Promise.all([
                healthRecordApi.getMyRecords(),
                healthRecordApi.getPatientProfile(),
                appointmentService.getMedicalHistory().catch(err => {
                    console.error('Error loading medical history:', err);
                    return null;
                })
            ]);
            setRecords(docsData);
            setHistory(profileData.medicalHistorySummary || "");
            setTempHistory(profileData.medicalHistorySummary || "");
            setMedicalHistory(historyData);
        } catch (error) {
            console.error("Error loading data", error);
        }
        setLoadingDocs(false);
        setLoadingHistory(false);
    };

    // Filter and sort records
    const getFilteredAndSortedRecords = () => {
        let filtered = [...records];

        // Apply category filter
        if (filterCategory !== 'all') {
            filtered = filtered.map(record => ({
                ...record,
                documents: record.documents?.filter(doc => doc.category === filterCategory)
            })).filter(record => record.documents && record.documents.length > 0);
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.map(record => ({
                ...record,
                documents: record.documents?.filter(doc =>
                    doc.documentName?.toLowerCase().includes(query) ||
                    doc.description?.toLowerCase().includes(query) ||
                    doc.category?.toLowerCase().includes(query) ||
                    doc.testResults?.toLowerCase().includes(query)
                )
            })).filter(record => record.documents && record.documents.length > 0);
        }

        // Apply sorting
        if (sortBy === 'newest') {
            // Sort record groups by lastUpdated (newest first)
            filtered.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

            // Sort documents INSIDE each record group by uploadedAt
            filtered = filtered.map(record => ({
                ...record,
                documents: record.documents?.sort((a, b) =>
                    new Date(b.uploadedAt) - new Date(a.uploadedAt)
                )
            }));

        } else if (sortBy === 'oldest') {
            // Sort record groups by lastUpdated (oldest first)
            filtered.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));

            // Sort documents INSIDE each record group by uploadedAt
            filtered = filtered.map(record => ({
                ...record,
                documents: record.documents?.sort((a, b) =>
                    new Date(a.uploadedAt) - new Date(b.uploadedAt)
                )
            }));
        }
        return filtered;
    };

    const handleViewDocument = (document) => {
        setSelectedDocument(document);
        setShowViewer(true);
    };
    const handleCloseViewer = () => {
        setShowViewer(false);
        setSelectedDocument(null);
    };

    // --- HANDLE SAVE HISTORY ---
    const handleSaveHistory = async () => {
        try {
            await healthRecordApi.updateMedicalHistory(tempHistory);
            setHistory(tempHistory);
            setIsEditingHistory(false);
            alert("Medical history updated!");
        } catch (error) {
            alert("Failed to update history");
        }
    };

    const handleViewAppointmentDetail = async (appointmentId) => {
        try {
            const detail = await appointmentService.getAppointmentDetail(appointmentId);
            setSelectedAppointment(detail);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error loading appointment detail:', error);
            alert('Failed to load appointment details');
        }
    };
    // NEW: Format date helper
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    // NEW: Get status badge styling
    const getStatusBadge = (status) => {
        const statusMap = {
            'Scheduled': 'bg-warning text-dark',
            'Completed': 'bg-success',
            'Cancelled': 'bg-danger',
            'Rescheduled': 'bg-info'
        };
        return statusMap[status] || 'bg-secondary';
    };

    // --- HANDLE UPLOAD FILE ---
    const handleFileChange = (e) => setFiles(e.target.files);

    const handleSubmitUpload = async (e) => {
        e.preventDefault();
        if (files.length === 0) return alert("Please select files.");
        const data = new FormData();

        // Append files
        for (let i = 0; i < files.length; i++) {
            data.append('Documents', files[i]);
        }

        // Append metadata
        data.append('Category', documentCategory);
        data.append('Description', description || '');
        data.append('DocumentDate', documentDate);

        // Append lab results if applicable
        if (documentCategory === 'Lab-Report' || documentCategory === 'Blood-Test') {
            data.append('TestResults', testResults || '');
            data.append('ReferenceRange', referenceRange || '');
            data.append('TestStatus', testStatus);
        }
        try {
            await healthRecordApi.createMedicalDocument(data);
            alert("✅ Uploaded successfully!");

            // Reset form
            setShowUploadForm(false);
            setFiles([]);
            setDocumentCategory('');
            setDescription('');
            setTestResults('');
            setReferenceRange('');
            setTestStatus('Normal');

            // Reload documents
            const newDocs = await healthRecordApi.getMyRecords();
            setRecords(newDocs);
        } catch (error) {
            console.error(error);
            alert("❌ Upload failed: " + (error.response?.data?.message || error.message));
        }
    };

    const getPaginatedAppointments = () => {
        if (!medicalHistory?.appointments) return [];

        // Filter only completed appointments
        const completedAppointments = medicalHistory.appointments.filter(
            apt => apt.status === 'Completed'
        );

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        return completedAppointments.slice(startIndex, endIndex);
    };

    const getCompletedAppointmentsCount = () => {
        if (!medicalHistory?.appointments) return 0;
        return medicalHistory.appointments.filter(apt => apt.status === 'Completed').length;
    };

    const totalPages = Math.ceil(getCompletedAppointmentsCount() / itemsPerPage);

    return (
        <div className='Background_Doctors'>
            <style>
            {`
                .nav-pills .nav-link.active {
                    color: #ffffff !important;
                }
            `}
        </style>
            <div className="container">
                {/* --- HEADER --- */}
                <div className="d-flex align-items-center mb-5 animate__animated animate__fadeInDown">
                    <div className="bg-primary text-white rounded-4 shadow-sm d-flex align-items-center justify-content-center me-3" style={{ width: 56, height: 56 }}>
                        <i className="bi bi-heart-pulse fs-3"></i>
                    </div>
                    <div>
                        <h2 className="mb-0 fw-bold text-dark">My Health Records</h2>
                        <p className="text-muted mb-0 small">Manage your medical history and personal documents</p>
                    </div>
                </div>

                {/* --- 1. MEDICAL HISTORY SECTION --- */}
                <div className="card border-0 shadow-sm rounded-4 mb-5 overflow-hidden animate__animated animate__fadeInUp">
                    {/* Header Tabs */}
                    <div className="card-header bg-white border-bottom p-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <h5 className="mb-0 fw-bold text-primary">
                                <i className="bi bi-journal-medical me-2"></i>Medical History
                            </h5>

                            <div className="nav nav-pills bg-light rounded-pill p-1">
    {/* Nút Summary */}
    <button
        type="button"
        className={`nav-link rounded-pill px-4 fw-medium ${
            historyView === 'summary' 
            ? 'active shadow-sm text-white' // <--- Thêm text-white vào đây
            : 'text-muted'
        }`}
        onClick={() => setHistoryView('summary')}
    >
        <i className="bi bi-file-text me-2"></i>Summary
    </button>
    
    {/* Nút History */}
    <button
        type="button"
        className={`nav-link rounded-pill px-4 fw-medium ${
            historyView === 'appointments' 
            ? 'active shadow-sm text-white' // <--- Thêm text-white vào đây
            : 'text-muted'
        }`}
        onClick={() => {
            setHistoryView('appointments');
            setCurrentPage(1);
        }}
    >
        <i className="bi bi-clock-history me-2"></i>History
        
        {/* Xử lý Badge: 
           - Nếu cha Active (xanh) -> Badge nền trắng, chữ xanh 
           - Nếu cha Inactive (xám) -> Badge nền xám đậm, chữ trắng 
        */}
        <span className={`badge ms-2 rounded-pill shadow-sm ${
            historyView === 'appointments' 
            ? 'bg-white text-primary' 
            : 'bg-secondary text-white'
        }`}>
            {medicalHistory?.totalAppointments || 0}
        </span>
    </button>
</div>
                        </div>
                    </div>

                    <div className="card-body p-4">
                        {/* VIEW: SUMMARY */}
                        {historyView === 'summary' && (
                            <div className="animate__animated animate__fadeIn">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold text-secondary mb-0">History Summary</h6>
                                    {!isEditingHistory && (
                                        <button className="btn btn-sm btn-light text-primary hover-shadow" onClick={() => setIsEditingHistory(true)}>
                                            <i className="bi bi-pencil-square me-1"></i> Edit
                                        </button>
                                    )}
                                </div>

                                {isEditingHistory ? (
                                    <div className="bg-light p-3 rounded-3 border">
                                        <textarea
                                            className="form-control border-0 bg-white shadow-none mb-3"
                                            rows="5"
                                            value={tempHistory}
                                            onChange={(e) => setTempHistory(e.target.value)}
                                            placeholder="E.g. Drug allergies, past surgeries, chronic conditions..."
                                        ></textarea>
                                        <div className="d-flex justify-content-end gap-2">
                                            <button className="btn btn-sm btn-secondary px-3 rounded-pill" onClick={() => setIsEditingHistory(false)}>Cancel</button>
                                            <button className="btn btn-sm btn-success px-3 rounded-pill" onClick={handleSaveHistory}>Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-3 bg-primary-subtle border border-primary-subtle text-dark">
                                        <p className="mb-0" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                                            {history || <span className="text-muted fst-italic opacity-75">No information yet. Click Edit to add details.</span>}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* VIEW: APPOINTMENTS */}
                        {historyView === 'appointments' && (
                            <div className="animate__animated animate__fadeIn">
                                {loadingHistory ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary mb-2"></div>
                                        <p className="text-muted small">Loading data...</p>
                                    </div>
                                ) : !medicalHistory || medicalHistory.totalAppointments === 0 ? (
                                    <div className="text-center py-5 bg-light rounded-3">
                                        <i className="bi bi-calendar-x fs-1 text-muted mb-2 d-block"></i>
                                        <p className="text-muted">You haven't had any appointments yet.</p>
                                    </div>
                                ) : (
                                    <div>
                                        {/* --- 1. OPTIMIZED SECTION: YOUR DOCTORS (Horizontal Scroll) --- */}
{medicalHistory?.doctorVisits?.length > 0 && (
    <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold text-secondary mb-0">
                <i className="bi bi-person-badge-fill me-2"></i>My Doctors ({medicalHistory.doctorVisits.length})
            </h6>
            {/* Mũi tên gợi ý cuộn nếu cần (chỉ để trang trí) */}
            {medicalHistory.doctorVisits.length > 2 && (
                <small className="text-muted"><i className="bi bi-arrow-right"></i> Scroll for more</small>
            )}
        </div>

        {/* Horizontal Scroll Container */}
        <div 
            className="d-flex gap-3 overflow-auto pb-3" 
            style={{ scrollbarWidth: 'thin' }} // Tạo thanh cuộn mảnh cho Firefox/Modern Browsers
        >
            {medicalHistory.doctorVisits.map(doctor => (
                <div 
                    key={doctor.doctorID} 
                    className="card border-0 shadow-sm rounded-3 flex-shrink-0"
                    style={{ minWidth: '280px', maxWidth: '280px' }} // Đặt chiều rộng cố định để tạo hiệu ứng cuộn
                >
                    <div className="card-body p-3">
                        {/* Header: Avatar + Info */}
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style={{width: 42, height: 42}}>
                                <i className="bi bi-person-fill fs-5"></i>
                            </div>
                            <div className="overflow-hidden">
                                <h6 className="fw-bold text-dark mb-0 text-truncate" title={doctor.doctorName}>
                                    {doctor.doctorName}
                                </h6>
                                <p className="text-muted small mb-0 text-truncate" title={doctor.doctorSpecialty}>
                                    {doctor.doctorSpecialty}
                                </p>
                            </div>
                        </div>
                        
                        {/* Footer: Stats */}
                        <div className="bg-light rounded p-2 d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted d-block text-uppercase" style={{fontSize: '0.65rem', letterSpacing: '0.5px'}}>Last Visit</span>
                                <span className="fw-bold text-dark small">
                                    {new Date(doctor.lastVisit).toLocaleDateString('en-GB')}
                                </span>
                            </div>
                            <span className="badge bg-white text-primary border shadow-sm rounded-pill">
                                {doctor.visitCount} visits
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
)}

                                        {/* --- 2. APPOINTMENT HISTORY TIMELINE --- */}
                                        <h6 className="fw-bold text-secondary mb-3">
                                            <i className="bi bi-clock-history me-2"></i>Appointment History
                                        </h6>
                                        <div className="d-flex flex-column gap-3">
                                            {getPaginatedAppointments().map((apt) => (
                                                <div key={apt.appointmentID} className="card border hover-shadow transition-all rounded-3">
                                                    <div className="card-body">
                                                        <div className="row align-items-center g-3">
                                                            {/* Date */}
                                                            <div className="col-md-3 border-end-md">
                                                                <h5 className="fw-bold text-dark mb-1">{formatDate(apt.appointmentTime).split(' ')[0]}</h5>
                                                                <span className="text-muted small d-block mb-2">{formatDate(apt.appointmentTime).split(' ')[1]}</span>
                                                                <span className={`badge rounded-pill ${getStatusBadge(apt.status)}`}>{apt.status}</span>
                                                            </div>

                                                            {/* Doctor Info */}
                                                            <div className="col-md-4">
                                                                <h6 className="fw-bold text-primary mb-1">{apt.doctorName}</h6>
                                                                <p className="text-muted small mb-2">{apt.doctorSpecialty}</p>
                                                                <span className="badge bg-light text-dark border">
                                                                    {apt.consultationType}
                                                                </span>
                                                            </div>

                                                            {/* Quick Stats */}
                                                            <div className="col-md-3">
                                                                <div className="d-flex flex-column gap-1 small">
                                                                    {apt.prescription && (
                                                                        <span className="text-success"><i className="bi bi-capsule me-2"></i>{apt.prescription.medicationCount} meds</span>
                                                                    )}
                                                                    {apt.invoice && (
                                                                        <span className="text-warning"><i className="bi bi-receipt me-2"></i>${apt.invoice.totalAmount}</span>
                                                                    )}
                                                                    {apt.consultation && (
                                                                        <span className="text-info"><i className="bi bi-journal-text me-2"></i>Has notes</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Action */}
                                                            <div className="col-md-2 text-md-end">
                                                                <button
                                                                    className="btn btn-outline-primary btn-sm rounded-pill px-3"
                                                                    onClick={() => handleViewAppointmentDetail(apt.appointmentID)}
                                                                >
                                                                    Details <i className="bi bi-chevron-right ms-1 small"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 2. DOCUMENT UPLOAD SECTION --- */}
                <div className="d-flex justify-content-between align-items-center mb-4 animate__animated animate__fadeIn">
                    <h4 className="fw-bold text-dark m-0">Medical Documents</h4>
                    <button
                        className={`btn ${showUploadForm ? 'btn-danger' : 'btn-primary'} rounded-pill shadow-sm px-4 fw-medium`}
                        onClick={() => setShowUploadForm(!showUploadForm)}
                    >
                        <i className={`bi ${showUploadForm ? 'bi-x-lg' : 'bi-cloud-upload'} me-2`}></i>
                        {showUploadForm ? 'Close Form' : 'Upload Documents'}
                    </button>
                </div>

                {showUploadForm && (
                    <div className="card border-0 shadow-sm bg-white rounded-4 mb-5 animate__animated animate__slideInDown">
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmitUpload}>
                                <div className="row g-4">
                                    {/* Left Column: Basic Info */}
                                    <div className="col-lg-5 border-end-lg">
                                        <h6 className="fw-bold text-secondary mb-3">Document Info</h6>

                                        <div className="mb-3">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Category <span className="text-danger">*</span></label>
                                            <select className="form-select bg-light border-0 py-2" value={documentCategory} onChange={e => setDocumentCategory(e.target.value)} required>
                                                <option value="">-- Choose Category --</option>
                                                <option value="X-Ray">🩻 X-Ray</option>
                                                <option value="CT-Scan">🔬 CT Scan</option>
                                                <option value="MRI">🧲 MRI</option>
                                                <option value="Ultrasound">📡 Ultrasound</option>
                                                <option value="Blood-Test">💉 Blood Test</option>
                                                <option value="Lab-Report">🧪 Lab Report</option>
                                                <option value="Prescription">💊 Prescription</option>
                                                <option value="Consultation-Notes">📝 Notes</option>
                                                <option value="Other">📄 Other</option>
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Date</label>
                                            <input type="date" className="form-control bg-light border-0 py-2" value={documentDate} onChange={e => setDocumentDate(e.target.value)} />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Attachments <span className="text-danger">*</span></label>
                                            <input type="file" className="form-control bg-light border-0" multiple accept="image/*,.pdf" onChange={handleFileChange} required />
                                            <div className="form-text small"><i className="bi bi-info-circle me-1"></i>Supports: PDF, JPG, PNG (Max 10MB)</div>

                                            {/* File Preview List */}
                                            {files.length > 0 && (
                                                <div className="mt-3 bg-light rounded p-2 border border-dashed">
                                                    <small className="text-success fw-bold d-block mb-1">✓ Selected {files.length} file(s):</small>
                                                    <ul className="mb-0 ps-3 small text-muted">
                                                        {Array.from(files).map((f, i) => <li key={i}>{f.name} ({(f.size / 1024).toFixed(0)} KB)</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Details & Results */}
                                    <div className="col-lg-7">
                                        <h6 className="fw-bold text-secondary mb-3">Details & Results</h6>

                                        <div className="mb-3">
                                            <label className="form-label small fw-bold text-muted text-uppercase">Description / Notes</label>
                                            <textarea
                                                className="form-control bg-light border-0"
                                                rows="3"
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder="E.g., Chest X-ray due to persistent cough..."
                                            ></textarea>
                                        </div>

                                        {/* Conditional Lab Results Inputs */}
                                        {(documentCategory === 'Lab-Report' || documentCategory === 'Blood-Test') && (
                                            <div className="card bg-primary-subtle border-primary-subtle p-3 rounded-3 animate__animated animate__fadeIn">
                                                <h6 className="card-title text-primary fw-bold mb-3"><i className="bi bi-activity me-2"></i>Lab Test Results</h6>
                                                <div className="row g-3">
                                                    <div className="col-md-4">
                                                        <label className="form-label small fw-bold">Result Value</label>
                                                        <input type="text" className="form-control form-control-sm border-0" placeholder="e.g. 120 mg/dL" value={testResults} onChange={e => setTestResults(e.target.value)} />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label small fw-bold">Ref. Range</label>
                                                        <input type="text" className="form-control form-control-sm border-0" placeholder="e.g. 70-100" value={referenceRange} onChange={e => setReferenceRange(e.target.value)} />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label small fw-bold">Status</label>
                                                        <select className="form-select form-select-sm border-0" value={testStatus} onChange={e => setTestStatus(e.target.value)}>
                                                            <option value="Normal">Normal 🟢</option>
                                                            <option value="Abnormal">Abnormal 🟡</option>
                                                            <option value="Critical">Critical 🔴</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                                            <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowUploadForm(false)}>Cancel</button>
                                            <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold shadow-sm">
                                                <i className="bi bi-cloud-arrow-up me-2"></i>Upload Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- 3. DOCUMENT LIST & FILTER --- */}
                <div className="card border-0 shadow-sm rounded-4 mb-5 animate__animated animate__fadeInUp">
                    {/* Filter Toolbar */}
                    <div className="card-header bg-white p-3 border-bottom-0">
                        <div className="row g-2 align-items-center">
                            <div className="col-md-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3"><i className="bi bi-search text-muted"></i></span>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-start-0 rounded-end-pill"
                                        placeholder="Search documents..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <select className="form-select bg-light border-0 rounded-pill" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                                    <option value="all">All Categories</option>
                                    <option value="X-Ray">🩻 X-Ray</option>
                                    <option value="CT-Scan">🔬 CT Scan</option>
                                    <option value="MRI">🧲 MRI</option>
                                    <option value="Ultrasound">📡 Ultrasound</option>
                                    <option value="Blood-Test">💉 Blood Test</option>
                                    <option value="Lab-Report">🧪 Lab Report</option>
                                    <option value="Prescription">💊 Prescription</option>
                                    <option value="Consultation-Notes">📝 Notes</option>
                                    <option value="Other">📄 Other</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <select className="form-select bg-light border-0 rounded-pill" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                    <option value="newest">🕒 Newest First</option>
                                    <option value="oldest">🕓 Oldest First</option>
                                </select>
                            </div>
                            <div className="col-md-1 text-end">
                                {(searchQuery || filterCategory !== 'all') && (
                                    <button className="btn btn-link text-danger text-decoration-none small" onClick={() => { setSearchQuery(''); setFilterCategory('all'); }}>
                                        <i className="bi bi-x-circle"></i> Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Document Grid */}
                    <div className="card-body bg-light rounded-bottom-4 p-4">
                        {loadingDocs ? (
                            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                        ) : getFilteredAndSortedRecords().length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-folder2-open fs-1 d-block mb-2 opacity-50"></i>
                                <p>No documents found matching your filters.</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {getFilteredAndSortedRecords().map(record => (
                                    record.documents?.map(doc => (
                                        <div key={doc.documentID} className="col-md-6 col-lg-4">
                                            <div className="card h-100 border-0 shadow-sm hover-translate-up rounded-3 overflow-hidden" style={{ transition: 'transform 0.2s' }}>
                                                <div className="card-body p-3">
                                                    <div className="d-flex align-items-start">
                                                        {/* File Icon/Thumb */}
                                                        <div className="me-3 flex-shrink-0" onClick={() => window.open(doc.fileUrl, '_blank')} style={{ cursor: 'pointer' }}>
                                                            {doc.documentType?.toLowerCase().includes('pdf') ? (
                                                                <div className="bg-danger-subtle text-danger rounded-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                                                                    <i className="bi bi-file-pdf fs-2"></i>
                                                                </div>
                                                            ) : (
                                                                <img src={doc.fileUrl} alt="thumb" className="rounded-3 object-fit-cover border" style={{ width: 56, height: 56 }} />
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-grow-1 overflow-hidden">
                                                            <h6 className="card-title text-truncate mb-1 fw-bold text-dark" title={doc.documentName}>
                                                                {doc.documentName}
                                                            </h6>
                                                            <div className="mb-2">
                                                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small me-1">
                                                                    {doc.category}
                                                                </span>
                                                                {doc.testStatus && (
                                                                    <span className={`badge rounded-pill small ${doc.testStatus === 'Normal' ? 'bg-success-subtle text-success' :
                                                                            doc.testStatus === 'Abnormal' ? 'bg-warning-subtle text-warning-emphasis' : 'bg-danger-subtle text-danger'
                                                                        }`}>
                                                                        {doc.testStatus}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                                                <i className="bi bi-calendar3 me-1"></i>
                                                                {new Date(doc.uploadedAt).toLocaleString('en-GB')}
                                                            </small>
                                                        </div>
                                                    </div>

                                                    {/* Description Preview */}
                                                    {doc.description && (
                                                        <div className="mt-2 bg-light p-2 rounded small text-muted text-truncate">
                                                            {doc.description}
                                                        </div>
                                                    )}

                                                    {/* Action Button */}
                                                    <button className="btn btn-sm btn-light w-100 mt-3 text-primary fw-medium" onClick={() => handleViewDocument(doc)}>
                                                        <i className="bi bi-eye me-1"></i> View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 4. PAGINATION --- */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center pb-5">
                        <nav>
                            <ul className="pagination shadow-sm">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link border-0 rounded-start-pill px-3 py-2 text-dark" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                                        <i className="bi bi-chevron-left"></i> Previous
                                    </button>
                                </li>
                                <li className="page-item disabled">
                                    <span className="page-link border-0 bg-white fw-bold px-3 py-2 text-primary">
                                        {currentPage} / {totalPages}
                                    </span>
                                </li>
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link border-0 rounded-end-pill px-3 py-2 text-dark" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                                        Next <i className="bi bi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}

                {/* --- MODALS --- */}

                {/* Appointment Detail Modal */}
                {showDetailModal && selectedAppointment && (
                    <div className="modal show d-block fade" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable animate__animated animate__zoomIn animate__faster">
                            <div className="modal-content rounded-4 border-0 shadow-lg">
                                <div className="modal-header bg-primary text-white border-bottom-0 rounded-top-4">
                                    <h5 className="modal-title fw-bold"><i className="bi bi-info-circle-fill me-2"></i>Appointment Details</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
                                </div>
                                <div className="modal-body p-4 bg-light">
                                    <div className="card border-0 shadow-sm rounded-3 mb-3">
                                        <div className="card-body">
                                            <h6 className="fw-bold text-primary mb-3">General Info</h6>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <small className="text-muted d-block">Date & Time</small>
                                                    <span className="fw-medium">{formatDate(selectedAppointment.appointmentTime)}</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <small className="text-muted d-block">Status</small>
                                                    <span className={`badge ${getStatusBadge(selectedAppointment.status)}`}>{selectedAppointment.status}</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <small className="text-muted d-block">Doctor</small>
                                                    <span className="fw-medium">{selectedAppointment.doctorName}</span> <span className="text-muted small">({selectedAppointment.doctorSpecialty})</span>
                                                </div>
                                                <div className="col-md-6">
                                                    <small className="text-muted d-block">Type</small>
                                                    <span className="fw-medium">{selectedAppointment.consultationType}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedAppointment.consultation && (
                                        <div className="card border-0 shadow-sm rounded-3 mb-3">
                                            <div className="card-body">
                                                <h6 className="fw-bold text-success mb-3">Consultation Notes</h6>
                                                {selectedAppointment.consultation.doctorNotes ? (
                                                    <div className="bg-light p-3 rounded text-dark" style={{ whiteSpace: 'pre-line' }}>
                                                        {selectedAppointment.consultation.doctorNotes}
                                                    </div>
                                                ) : <span className="text-muted fst-italic">No notes available.</span>}
                                                {selectedAppointment.consultation.followUpDate && (
                                                    <div className="mt-3 alert alert-info py-2 mb-0">
                                                        <i className="bi bi-calendar-event me-2"></i>Follow-up: <strong>{new Date(selectedAppointment.consultation.followUpDate).toLocaleDateString('en-GB')}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {selectedAppointment.prescription && (
                                        <div className="card border-0 shadow-sm rounded-3 mb-3">
                                            <div className="card-body">
                                                <h6 className="fw-bold text-danger mb-3">Prescription</h6>
                                                <ul className="list-group list-group-flush rounded-3">
                                                    {selectedAppointment.prescription.medicationNames.map((med, i) => (
                                                        <li key={i} className="list-group-item px-0"><i className="bi bi-dot"></i> {med}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {selectedAppointment.invoice && (
                                        <div className="card border-0 shadow-sm rounded-3">
                                            <div className="card-body d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="fw-bold text-warning mb-1">Payment</h6>
                                                    <span className={`badge ${selectedAppointment.invoice.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                        {selectedAppointment.invoice.paymentStatus}
                                                    </span>
                                                </div>
                                                <div className="text-end">
                                                    <span className="fs-4 fw-bold text-dark">${selectedAppointment.invoice.totalAmount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer border-top-0 bg-white rounded-bottom-4">
                                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowDetailModal(false)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Document Viewer Modal */}
                {selectedDocument && (
                    <DocumentViewerModal
                        show={showViewer}
                        onHide={handleCloseViewer}
                        document={selectedDocument}
                    />
                )}
            </div>
        </div>
    );
};

export default HealthRecords;