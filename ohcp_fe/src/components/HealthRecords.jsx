import React, { useEffect, useState, useRef } from 'react';
import { healthRecordApi } from '../api/healthRecordApi';
import DocumentViewerModal from './DocumentViewerModal';
import { appointmentService } from '../api/appointmentApi';
import Loading from './Loading';
import "../components/Css/HealthRecords.css"
import { toast } from 'sonner';

const HealthRecords = () => {
    // State for Documents
    const [records, setRecords] = useState([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true); // Initial page loading
    const [loadingDocs, setLoadingDocs] = useState(false);
    const timelineRef = useRef(null);

    // State for Medical History
    const [history, setHistory] = useState("");
    const [medicalHistory, setMedicalHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [itemsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedCards, setExpandedCards] = useState({});

    // States for upload form
    const [documentCategory, setDocumentCategory] = useState('');
    const [description, setDescription] = useState('');
    const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
    const [testResults, setTestResults] = useState('');
    const [referenceRange, setReferenceRange] = useState('');
    const [testStatus, setTestStatus] = useState('Normal');
    const [includeHistory, setIncludeHistory] = useState(true);
    
    // States for filters & search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [showViewer, setShowViewer] = useState(false);

    // Initial loading effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!loading) {
            loadData();
        }
    }, [loading]);

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

        if (filterCategory !== 'all') {
            filtered = filtered.map(record => ({
                ...record,
                documents: record.documents?.filter(doc => doc.category === filterCategory)
            })).filter(record => record.documents && record.documents.length > 0);
        }

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

        if (sortBy === 'newest') {
            filtered.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
            filtered = filtered.map(record => ({
                ...record,
                documents: record.documents?.sort((a, b) =>
                    new Date(b.uploadedAt) - new Date(a.uploadedAt)
                )
            }));
        } else if (sortBy === 'oldest') {
            filtered.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));
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

    const handleViewAppointmentDetail = async (appointmentId) => {
        try {
            const detail = await appointmentService.getAppointmentDetail(appointmentId);
            setSelectedAppointment(detail);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error loading appointment detail:', error);
            toast.error('Failed to load appointment details');
        }
    };

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

    const getStatusBadge = (status) => {
        const statusMap = {
            'Scheduled': 'bg-warning text-dark',
            'Completed': 'bg-success',
            'Cancelled': 'bg-danger',
            'Rescheduled': 'bg-info'
        };
        return statusMap[status] || 'bg-secondary';
    };

    const handleFileChange = (e) => setFiles(e.target.files);

    const handleSubmitUpload = async (e) => {
        e.preventDefault();
        if (files.length === 0) return toast.warning("Please select files.");
        
        const data = new FormData();

        for (let i = 0; i < files.length; i++) {
            data.append('Documents', files[i]);
        }

        data.append('Category', documentCategory);
        data.append('Description', description || '');
        data.append('DocumentDate', documentDate);

        if (documentCategory === 'Lab-Report' || documentCategory === 'Blood-Test') {
            data.append('TestResults', testResults || '');
            data.append('ReferenceRange', referenceRange || '');
            data.append('TestStatus', testStatus);
        }

        if (includeHistory && history.trim()) {
            try {
                await healthRecordApi.updateMedicalHistory(history);
            } catch (err) {
                console.error("Failed to update medical history:", err);
            }
        }

        setLoadingDocs(true);
        try {
            await healthRecordApi.createMedicalDocument(data);
            toast.success("✅ Uploaded successfully!");

            setShowUploadForm(false);
            setFiles([]);
            setDocumentCategory('');
            setDescription('');
            setTestResults('');
            setReferenceRange('');
            setTestStatus('Normal');

            const newDocs = await healthRecordApi.getMyRecords();
            setRecords(newDocs);
        } catch (error) {
            console.error(error);
            toast.error("Upload failed: " + (error.response?.data?.message || error.message));
        } finally {
            setLoadingDocs(false);
        }
    };

    const getPaginatedAppointments = () => {
        if (!medicalHistory?.appointments) return [];

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

    const getViewUrl = (documentID) => {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7267';
        const token = localStorage.getItem('token');
        return `${apiBaseUrl}/api/HealthRecord/document/${documentID}?token=${encodeURIComponent(token)}`;
    };

    const toggleCardExpand = (appointmentID) => {
        setExpandedCards(prev => ({
            ...prev,
            [appointmentID]: !prev[appointmentID]
        }));
    };

    // Hiển thị Loading component full screen khi initial load
    if (loading) {
        return <Loading />;
    }

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
                <div className="d-flex align-items-center justify-content-center mb-5 animate__animated animate__fadeInDown">
                    <div className="bg-primary text-white rounded-4 shadow-sm d-flex align-items-center justify-content-center me-3" style={{ width: 56, height: 56 }}>
                        <i className="bi bi-heart-pulse fs-3"></i>
                    </div>
                    <div className="text-center">
                        <h2 className="mb-0 fw-bold text-dark">My Health Records</h2>
                        <p className="text-muted mb-0 small">Manage your medical history and personal documents</p>
                    </div>
                </div>

                {/* --- 1. MEDICAL HISTORY SECTION --- */}
                <div className="card border-0 shadow-sm rounded-4 mb-5 overflow-hidden animate__animated animate__fadeInUp">
                    <div className="card-header bg-white border-bottom p-4">
                        <h5 className="mb-0 fw-bold text-primary">
                            <i className="bi bi-file-medical me-2"></i>Medical Record
                        </h5>
                    </div>

                    <div className="card-body p-4">
                        <div className="animate__animated animate__fadeIn">
                            {loadingHistory ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary mb-2"></div>
                                    <p className="text-muted small">Loading medical history...</p>
                                </div>
                            ) : !medicalHistory || medicalHistory.totalAppointments === 0 ? (
                                <div className="text-center py-5 bg-light rounded-3">
                                    <i className="bi bi-calendar-x fs-1 text-muted mb-2 d-block"></i>
                                    <p className="text-muted">You haven't had any appointments yet.</p>
                                </div>
                            ) : (
                                <div>
                                    {/* YOUR DOCTORS - giữ nguyên code */}
                                    {medicalHistory?.doctorVisits?.length > 0 && (
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="fw-bold text-secondary mb-0">
                                                    <i className="bi bi-person-badge-fill me-2"></i>My Doctors ({medicalHistory.doctorVisits.length})
                                                </h6>
                                            </div>
                                            {/* Doctor cards - giữ nguyên */}
                                        </div>
                                    )}

                                    {/* TIMELINE - giữ nguyên phần timeline của bạn */}
                                    <h6 className="fw-bold text-secondary mb-3">
                                        <i className="bi bi-clipboard2-pulse me-2"></i>Medical Record Timeline
                                    </h6>
                                    {/* ... Timeline content ... */}
                                </div>
                            )}
                        </div>
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

                {/* Upload Form - giữ nguyên */}
                {showUploadForm && (
                    <div className="card border-0 shadow-sm bg-white rounded-4 mb-5 animate__animated animate__slideInDown">
                        {/* ... Upload form content ... */}
                    </div>
                )}

                {/* --- 3. DOCUMENT LIST & FILTER --- */}
                <div className="card border-0 shadow-sm rounded-4 mb-5 animate__animated animate__fadeInUp">
                    <div className="card-header bg-white p-3 border-bottom-0">
                        <div className="row g-2 align-items-center">
                            <div className="col-md-5">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                                        <i className="bi bi-search text-muted"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-start-0 rounded-end-pill"
                                        placeholder="Search documents..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* Filter controls - giữ nguyên */}
                        </div>
                    </div>

                    <div className="card-body bg-light rounded-bottom-4 p-4">
                        {loadingDocs ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary"></div>
                                <p className="text-muted mt-2">Loading documents...</p>
                            </div>
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
                                            <div className="card h-100 border-0 shadow-sm hover-translate-up rounded-3 overflow-hidden">
                                                <div className="card-body p-3">
                                                    <div className="d-flex align-items-start">
                                                        <div className="me-3 flex-shrink-0">
                                                            {doc.documentType?.toLowerCase().includes('pdf') ? (
                                                                <div className="bg-danger-subtle text-danger rounded-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                                                                    <i className="bi bi-file-pdf fs-2"></i>
                                                                </div>
                                                            ) : (
                                                                <img src={getViewUrl(doc.documentID)} alt="thumb" className="rounded-3 object-fit-cover border" style={{ width: 56, height: 56 }} />
                                                            )}
                                                        </div>

                                                        <div className="flex-grow-1 overflow-hidden">
                                                            <h6 className="card-title text-truncate mb-1 fw-bold text-dark" title={doc.documentName}>
                                                                {doc.documentName}
                                                            </h6>
                                                            <div className="mb-2">
                                                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small me-1">
                                                                    {doc.category}
                                                                </span>
                                                            </div>
                                                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                                                <i className="bi bi-calendar3 me-1"></i>
                                                                {new Date(doc.uploadedAt).toLocaleString('en-GB')}
                                                            </small>
                                                        </div>
                                                    </div>

                                                    {doc.description && (
                                                        <div className="mt-2 bg-light p-2 rounded small text-muted text-truncate">
                                                            {doc.description}
                                                        </div>
                                                    )}

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