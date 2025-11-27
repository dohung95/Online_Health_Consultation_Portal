import React, { useEffect, useState } from 'react';
import { healthRecordApi } from '../api/healthRecordApi';

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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingDocs(true);
        try {
            const [docsData, profileData] = await Promise.all([
                healthRecordApi.getMyRecords(),
                healthRecordApi.getPatientProfile()
            ]);
            setRecords(docsData);
            setHistory(profileData.medicalHistorySummary || "");
            setTempHistory(profileData.medicalHistorySummary || "");
        } catch (error) {
            console.error("Error loading data", error);
        }
        setLoadingDocs(false);
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

    return (
        <div className='Background_Doctors'>
            <div className="container mt-4">
                <h2 className="mb-4">My Health Records</h2>

                {/* 1. MEDICAL HISTORY SECTION */}
                <div className="card shadow-sm mb-5">
                    <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0"><i className="bi bi-journal-medical me-2"></i>Medical History Summary</h5>
                        {!isEditingHistory && (
                            <button className="btn btn-sm btn-light text-primary" onClick={() => setIsEditingHistory(true)}>
                                <i className="bi bi-pencil-square"></i> Edit
                            </button>
                        )}
                    </div>
                    <div className="card-body">
                        {isEditingHistory ? (
                            <div>
                                <textarea
                                    className="form-control mb-3" rows="4"
                                    value={tempHistory}
                                    onChange={(e) => setTempHistory(e.target.value)}
                                    placeholder="E.g. Drug allergies, past surgeries..."
                                ></textarea>
                                <button className="btn btn-success me-2" onClick={handleSaveHistory}>Save</button>
                                <button className="btn btn-secondary" onClick={() => setIsEditingHistory(false)}>Cancel</button>
                            </div>
                        ) : (
                            <p className="card-text" style={{ whiteSpace: 'pre-line' }}>
                                {history || <span className="text-muted fst-italic">No information yet.</span>}
                            </p>
                        )}
                    </div>
                </div>

                {/* 2. DOCUMENTS UPLOAD SECTION */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4>Medical Documents</h4>
                    <button className="btn btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
                        {showUploadForm ? 'Close Form' : '+ Upload Documents'}
                    </button>
                </div>

                {showUploadForm && (
                    <div className="card p-4 mb-4 bg-light border-0">
                        <form onSubmit={handleSubmitUpload}>

                            {/* Document Category */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">
                                    <i className="bi bi-tag me-2"></i>Document Category *
                                </label>
                                <select
                                    className="form-select"
                                    value={documentCategory}
                                    onChange={e => setDocumentCategory(e.target.value)}
                                    required
                                >
                                    <option value="">Choose category...</option>
                                    <option value="X-Ray">🩻 X-Ray</option>
                                    <option value="CT-Scan">🔬 CT Scan</option>
                                    <option value="MRI">🧲 MRI</option>
                                    <option value="Ultrasound">📡 Ultrasound</option>
                                    <option value="Blood-Test">💉 Blood Test</option>
                                    <option value="Lab-Report">🧪 Lab Report</option>
                                    <option value="Prescription">💊 Prescription</option>
                                    <option value="Consultation-Notes">📝 Consultation Notes</option>
                                    <option value="Other">📄 Other</option>
                                </select>
                            </div>
                            {/* File Upload */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">
                                    <i className="bi bi-cloud-upload me-2"></i>Select Files *
                                </label>
                                <input
                                    type="file"
                                    className="form-control"
                                    multiple
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    required
                                />
                                <div className="form-text">
                                    ℹ️ Accepted: JPEG, PNG, PDF | Max: 10MB per file
                                </div>

                                {/* File Preview */}
                                {files.length > 0 && (
                                    <div className="mt-2 p-2 bg-white rounded border">
                                        <small className="text-success fw-bold">
                                            ✓ {files.length} file(s) selected:
                                        </small>
                                        <ul className="list-unstyled mt-1 mb-0">
                                            {Array.from(files).map((file, idx) => (
                                                <li key={idx} className="text-muted small">
                                                    📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            {/* Document Date */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">
                                    <i className="bi bi-calendar3 me-2"></i>Document Date
                                </label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={documentDate}
                                    onChange={e => setDocumentDate(e.target.value)}
                                />
                                <div className="form-text">When was this test/scan performed?</div>
                            </div>
                            {/* Description */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">
                                    <i className="bi bi-card-text me-2"></i>Description/Notes
                                </label>
                                <textarea
                                    className="form-control"
                                    rows="2"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="E.g., 'Chest X-ray due to persistent cough'"
                                ></textarea>
                            </div>
                            {/* Lab Results Section - Show only for Lab/Blood Test categories */}
                            {(documentCategory === 'Lab-Report' || documentCategory === 'Blood-Test') && (
                                <div className="border rounded p-3 mb-3 bg-white">
                                    <h6 className="mb-3">
                                        <i className="bi bi-clipboard-data me-2"></i>Lab Results Details
                                    </h6>

                                    <div className="row">
                                        <div className="col-md-4 mb-2">
                                            <label className="form-label">Test Results</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={testResults}
                                                onChange={e => setTestResults(e.target.value)}
                                                placeholder="E.g., 120 mg/dL"
                                            />
                                        </div>

                                        <div className="col-md-4 mb-2">
                                            <label className="form-label">Reference Range</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={referenceRange}
                                                onChange={e => setReferenceRange(e.target.value)}
                                                placeholder="E.g., 70-100 mg/dL"
                                            />
                                        </div>

                                        <div className="col-md-4 mb-2">
                                            <label className="form-label">Status</label>
                                            <select
                                                className="form-select"
                                                value={testStatus}
                                                onChange={e => setTestStatus(e.target.value)}
                                            >
                                                <option value="Normal">Normal</option>
                                                <option value="Abnormal">Abnormal</option>
                                                <option value="Critical">Critical</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Buttons */}
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-success">
                                    <i className="bi bi-upload me-2"></i>Upload Documents
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setShowUploadForm(false);
                                        // Reset form
                                        setDocumentCategory('');
                                        setDescription('');
                                        setTestResults('');
                                        setReferenceRange('');
                                        setTestStatus('Normal');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* FILTERS & SEARCH */}
                <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-body">
                        <div className="row g-3">
                            {/* Search */}
                            <div className="col-md-6">
                                <label className="form-label fw-bold">
                                    <i className="bi bi-search me-2"></i>Search
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-search"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by name, description, category..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="col-md-3">
                                <label className="form-label fw-bold">
                                    <i className="bi bi-funnel me-2"></i>Category
                                </label>
                                <select
                                    className="form-select"
                                    value={filterCategory}
                                    onChange={e => setFilterCategory(e.target.value)}
                                >
                                    <option value="all">All Categories</option>
                                    <option value="X-Ray">🩻 X-Ray</option>
                                    <option value="CT-Scan">🔬 CT Scan</option>
                                    <option value="MRI">🧲 MRI</option>
                                    <option value="Ultrasound">📡 Ultrasound</option>
                                    <option value="Blood-Test">💉 Blood Test</option>
                                    <option value="Lab-Report">🧪 Lab Report</option>
                                    <option value="Prescription">💊 Prescription</option>
                                    <option value="Consultation-Notes">📝 Consultation Notes</option>
                                    <option value="Other">📄 Other</option>
                                </select>
                            </div>

                            {/* Sort */}
                            <div className="col-md-3">
                                <label className="form-label fw-bold">
                                    <i className="bi bi-sort-down me-2"></i>Sort By
                                </label>
                                <select
                                    className="form-select"
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>

                        {/* Results count */}
                        <div className="mt-3">
                            <small className="text-muted">
                                <i className="bi bi-info-circle me-1"></i>
                                Showing {getFilteredAndSortedRecords().reduce((sum, r) => sum + (r.documents?.length || 0), 0)} document(s)
                                {(searchQuery || filterCategory !== 'all') && (
                                    <button
                                        className="btn btn-sm btn-link text-decoration-none ms-2"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setFilterCategory('all');
                                        }}
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </small>
                        </div>
                    </div>
                </div>

                {/* 3. DOCUMENT LIST */}
                {loadingDocs ? (
                    <div className="text-center">
                        <div className="spinner-border"></div>
                    </div>
                ) : (
                    <div>
                        {getFilteredAndSortedRecords().length === 0 ? (
                            <div className="alert alert-light border">
                                <i className="bi bi-inbox me-2"></i>
                                {searchQuery || filterCategory !== 'all'
                                    ? 'No documents match your filters.'
                                    : 'No documents found.'}
                            </div>
                        ) : (
                            getFilteredAndSortedRecords().map(record => (
                                <div key={record.healthRecordID} className="card mb-3 shadow-sm">
                                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                        <span className="fw-bold text-primary">
                                            <i className="bi bi-calendar-event me-2"></i>
                                            {/* Use toLocaleDateString to show only date */}
                                            Upload Session - {new Date(record.lastUpdated).toLocaleDateString('vi-VN')}
                                        </span>

                                        <span className="badge bg-light text-dark border">
                                            {record.documents?.length || 0} file(s)
                                        </span>
                                    </div>
                                    <div className="card-body">
                                        {record.documents?.map(doc => (
                                            <div key={doc.documentID} className="border rounded p-3 mb-3 bg-light">
                                                {/* Header with category badge */}
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        {/* Container use Flex to align Image and Name horizontally */}
                                                        <div className="d-flex align-items-center mb-2">

                                                            {/* PART 1: DISPLAY THUMBNAIL OR ICON */}
                                                            <div className="me-3">
                                                                {doc.documentType?.toLowerCase().includes('pdf') ? (
                                                                    // if PDF: show Icon
                                                                    <i className="bi bi-file-pdf text-danger" style={{ fontSize: '2.5rem' }}></i>
                                                                ) : (
                                                                    // if Image: show Image
                                                                    <img
                                                                        src={doc.fileUrl}
                                                                        alt={doc.documentName}
                                                                        className="rounded border shadow-sm"
                                                                        style={{
                                                                            width: '60px',
                                                                            height: '60px',
                                                                            objectFit: 'cover', 
                                                                            cursor: 'pointer' 
                                                                        }}
                                                                        // if click: open in new tab
                                                                        onClick={() => window.open(doc.fileUrl, '_blank')}
                                                                    />
                                                                )}
                                                            </div>

                                                            {/* FILE NAME & CATEGORY */}
                                                            <div>
                                                                <h6 className="mb-1 fw-bold text-break">{doc.documentName}</h6>
                                                            </div>
                                                        </div>
                                                        {doc.category && (
                                                            <span className="badge bg-primary me-2">
                                                                {doc.category}
                                                            </span>
                                                        )}
                                                        {doc.documentDate && (
                                                            <small className="text-muted">
                                                                <i className="bi bi-clock-history me-1"></i>
                                                                {new Date(doc.uploadedAt).toLocaleString('vi-VN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric'
                                                                })}
                                                            </small>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={doc.fileUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="btn btn-sm btn-outline-primary"
                                                    >
                                                        <i className="bi bi-eye me-1"></i>View
                                                    </a>
                                                </div>
                                                {/* Description */}
                                                {doc.description && (
                                                    <p className="mb-2 text-muted small">
                                                        <i className="bi bi-card-text me-1"></i>
                                                        {doc.description}
                                                    </p>
                                                )}
                                                {/* Lab Results - Show if available */}
                                                {doc.TestResults && (
                                                    <div className="bg-white rounded p-2 mt-2">
                                                        <div className="row g-2 small">
                                                            <div className="col-md-4">
                                                                <strong>Results:</strong> {doc.TestResults}
                                                            </div>
                                                            <div className="col-md-4">
                                                                <strong>Reference:</strong> {doc.referenceRange || 'N/A'}
                                                            </div>
                                                            <div className="col-md-4">
                                                                <strong>Status:</strong>{' '}
                                                                <span className={`badge ${doc.testStatus === 'Normal' ? 'bg-success' :
                                                                    doc.testStatus === 'Abnormal' ? 'bg-warning' : 'bg-danger'
                                                                    }`}>
                                                                    {doc.testStatus || 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthRecords;