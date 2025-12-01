import React, { useEffect, useState } from 'react';
import { shareApi } from '../api/shareRecordApi';
import { doctorService } from '../api/doctorApi';
import { healthRecordApi } from '../api/healthRecordApi';
const ShareHealthRecords = () => {
    // States
    const [doctors, setDoctors] = useState([]);
    const [healthRecords, setHealthRecords] = useState([]);
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(false);
    // Form states
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedRecord, setSelectedRecord] = useState('');
    const [permissionLevel, setPermissionLevel] = useState('View');
    const [expiryDate, setExpiryDate] = useState('');
    const [searchDoctor, setSearchDoctor] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [shareAll, setShareAll] = useState(true);
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setLoading(true);
        try {
            const [doctorsData, recordsData, sharesData] = await Promise.all([
                doctorService.getAllDoctors(),
                healthRecordApi.getMyRecords(),
                shareApi.getMyShares()
            ]);
            setDoctors(doctorsData);
            setHealthRecords(recordsData);
            setShares(sharesData);
        } catch (error) {
            console.error("Error loading data", error);
            alert("Failed to load data");
        }
        setLoading(false);
    };

    const getCurrentDocuments = () => {
        if (!selectedRecord) return [];
        const record = healthRecords.find(r => r.healthRecordID === parseInt(selectedRecord));
        return record?.documents || [];
    };
    // Handle "Select All" toggle
    const handleShareAllToggle = (e) => {
        const checked = e.target.checked;
        setShareAll(checked);
        if (checked) {
            setSelectedDocuments([]);  // Clear individual selections
        }
    };
    // Handle individual document checkbox
    const handleDocumentToggle = (e) => {
        const documentId = parseInt(e.target.value);
        const checked = e.target.checked;

        if (checked) {
            setSelectedDocuments(prev => [...prev, documentId]);
        } else {
            setSelectedDocuments(prev => prev.filter(id => id !== documentId));
        }
    };
    // Reset advanced panel when record changes
    const handleRecordChange = (e) => {
        setSelectedRecord(e.target.value);
        setShowAdvanced(false);  // Collapse panel
        setShareAll(true);       // Reset to share all
        setSelectedDocuments([]); // Clear selections
    };

    const handleShare = async (e) => {
        e.preventDefault();
        // ✅ VALIDATION: If advanced mode + no docs selected
        if (!shareAll && selectedDocuments.length === 0) {
            alert('Please select at least one document to share, or check "Select All"');
            return;
        }
        try {
            const data = {
                healthRecordID: parseInt(selectedRecord),
                documentIDs: shareAll ? null : selectedDocuments,
                doctorID: selectedDoctor,
                permissionLevel,
                expiryDate: expiryDate || null
            };
            await shareApi.shareWithDoctor(data);

            const shareType = shareAll ? 'Entire record' : `${selectedDocuments.length} document(s)`;
            alert(`✅ Shared successfully! ${shareType} shared.`);
            // Reset form
            setSelectedRecord('');
            setSelectedDoctor('');
            setPermissionLevel('View');
            setExpiryDate('');
            setSearchDoctor('');
            setShowAdvanced(false);
            setShareAll(true);
            setSelectedDocuments([]);
            // Reload data
            loadData();
        } catch (error) {
            console.error('Share error:', error);
            alert('Failed to share: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleRevoke = async (shareId) => {
        if (!window.confirm('Are you sure you want to revoke access to this doctor?')) {
            return;
        }
        try {
            await shareApi.revokeShare(shareId);
            alert('✅ Access revoked successfully');
            loadData();
        } catch (error) {
            console.error(error);
            alert('❌ Failed to revoke access');
        }
    };

    const filteredDoctors = doctors.filter(doc =>
        doc.fullName?.toLowerCase().includes(searchDoctor.toLowerCase()) ||
        doc.specialization?.toLowerCase().includes(searchDoctor.toLowerCase())
    );
    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border" role="status"></div>
            </div>
        );
    }
    return (
        <div className="Background_Doctors">
            <div className="container mt-4">
                <h2 className="mb-4">
                    <i className="bi bi-share me-2"></i>
                    Share Health Records
                </h2>
                {/* INFO ALERT */}
                <div className="alert alert-info" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Consent-based Sharing:</strong> You control who can access your health records.
                    You can revoke access anytime.
                </div>
                {/* SHARE NEW FORM */}
                <div className="card mb-4 shadow-sm">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-plus-circle me-2"></i>
                            Share with Doctor
                        </h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleShare}>
                            <div className="row">
                                {/* Select Health Record with Preview */}
                                <div className="col-md-12 mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="bi bi-folder2-open me-2"></i>
                                        Select Health Record *
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedRecord}
                                        onChange={handleRecordChange}
                                        required
                                    >
                                        <option value="">Choose record...</option>
                                        {healthRecords.map(record => (
                                            <option key={record.healthRecordID} value={record.healthRecordID}>
                                                
                                                {new Date(record.lastUpdated).toLocaleDateString()}
                                                ({record.documents?.length || 0} document(s))
                                            </option>
                                        ))}
                                    </select>
                                    {healthRecords.length === 0 && (
                                        <small className="text-muted">
                                            No health records found. Upload documents first.
                                        </small>
                                    )}

                                    {/* ✅ COLLAPSIBLE ADVANCED PANEL - NEW! */}
                                    {selectedRecord && (
                                        <div className="mt-3">
                                            <button
                                                type="button"
                                                className="btn btn-link text-decoration-none p-0"
                                                onClick={() => setShowAdvanced(!showAdvanced)}
                                            >
                                                <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'} me-2`}></i>
                                                <strong>Advanced: Select Specific Documents</strong>
                                            </button>

                                            {!showAdvanced && (
                                                <div className="alert alert-info mt-2 py-2">
                                                    <small>
                                                        <i className="bi bi-info-circle me-1"></i>
                                                        Entire record will be shared ({getCurrentDocuments().length} documents)
                                                    </small>
                                                </div>
                                            )}

                                            {showAdvanced && (
                                                <div className="border rounded p-3 mt-2 bg-light">
                                                    {/* Select All Checkbox */}
                                                    <div className="form-check mb-2 pb-2" style={{ borderBottom: '1px solid #dee2e6' }}>
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            id="share-all-checkbox"
                                                            checked={shareAll}
                                                            onChange={handleShareAllToggle}
                                                        />
                                                        <label className="form-check-label fw-bold" htmlFor="share-all-checkbox">
                                                            <i className="bi bi-folder me-1"></i>
                                                            Select All (Share Entire Record)
                                                        </label>
                                                    </div>

                                                    {/* Individual Document Checkboxes */}
                                                    <div className="mt-2">
                                                        <small className="text-muted d-block mb-2">
                                                            Or select specific documents to share:
                                                        </small>

                                                        {getCurrentDocuments().length > 0 ? (
                                                            getCurrentDocuments().map((doc, idx) => (
                                                                <div key={idx} className="form-check ms-3 mb-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        id={`doc-checkbox-${idx}`}
                                                                        value={doc.documentID}
                                                                        checked={!shareAll && selectedDocuments.includes(doc.documentID)}
                                                                        onChange={handleDocumentToggle}
                                                                        disabled={shareAll}
                                                                    />
                                                                    <label
                                                                        className="form-check-label"
                                                                        htmlFor={`doc-checkbox-${idx}`}
                                                                        style={{ opacity: shareAll ? 0.5 : 1, cursor: shareAll ? 'not-allowed' : 'pointer' }}
                                                                    >
                                                                        📄 <strong>{doc.documentType || 'Document'}</strong>
                                                                        {doc.fileName && ` - ${doc.fileName}`}
                                                                        {doc.uploadDate && (
                                                                            <small className="text-muted d-block ms-3">
                                                                                Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                                                                            </small>
                                                                        )}
                                                                    </label>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-muted ms-3 mb-0">No documents in this record</p>
                                                        )}
                                                    </div>

                                                    {/* Summary */}
                                                    {!shareAll && (
                                                        <div className="alert alert-warning mt-3 mb-0" role="alert">
                                                            <small>
                                                                <i className="bi bi-exclamation-triangle me-1"></i>
                                                                <strong>{selectedDocuments.length} document(s) selected</strong>
                                                                {selectedDocuments.length === 0 && ' - Please select at least one document'}
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Search & Select Doctor */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="bi bi-person-badge me-2"></i>
                                        Select Doctor *
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control mb-2"
                                        placeholder="🔍 Search by name or specialty..."
                                        value={searchDoctor}
                                        onChange={e => setSearchDoctor(e.target.value)}
                                    />
                                    <select
                                        className="form-select"
                                        value={selectedDoctor}
                                        onChange={e => setSelectedDoctor(e.target.value)}
                                        required
                                        size="4"
                                    >
                                        <option value="">Choose doctor...</option>
                                        {filteredDoctors.map(doc => (
                                            <option key={doc.doctorID} value={doc.doctorID}>
                                                {doc.fullName} - {doc.specialization}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Permission Level */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="bi bi-shield-lock me-2"></i>
                                        Permission Level
                                    </label>
                                    <select
                                        className="form-select"
                                        value={permissionLevel}
                                        onChange={e => setPermissionLevel(e.target.value)}
                                    >
                                        <option value="View">View Only</option>
                                        <option value="ViewAndEdit">View & Edit</option>
                                    </select>
                                    <small className="text-muted">
                                        {permissionLevel === 'View'
                                            ? 'Doctor can only view your records'
                                            : 'Doctor can view and add notes to your records'}
                                    </small>
                                </div>
                                {/* Expiry Date */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold">
                                        <i className="bi bi-calendar-x me-2"></i>
                                        Expiry Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={expiryDate}
                                        onChange={e => setExpiryDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <small className="text-muted">
                                        Access will automatically expire on this date
                                    </small>
                                </div>
                            </div>
                            {/* Submit Button */}
                            <button type="submit" className="btn btn-success">
                                <i className="bi bi-share me-2"></i>
                                {shareAll
                                    ? 'Share Entire Record'
                                    : `Share ${selectedDocuments.length} Document${selectedDocuments.length !== 1 ? 's' : ''}`
                                }
                            </button>
                        </form>
                    </div>
                </div>
                {/* CURRENTLY SHARED */}
                <div className="card shadow-sm">
                    <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <i className="bi bi-people me-2"></i>
                            Currently Shared With
                        </h5>
                        <span className="badge bg-light text-dark">
                            {shares.length} doctor(s)
                        </span>
                    </div>
                    <div className="card-body">
                        {shares.length === 0 ? (
                            <p className="text-muted text-center mb-0">
                                <i className="bi bi-inbox me-2"></i>
                                No records shared yet.
                            </p>
                        ) : (
                            <div className="list-group">
                                {shares.map(share => (
                                    <div
                                        key={share.shareID}
                                        className="list-group-item d-flex justify-content-between align-items-start"
                                    >
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">
                                                <i className="bi bi-person-badge me-2 text-primary"></i>
                                                Dr. {share.doctorName}
                                            </h6>
                                            <p className="mb-1 small">
                                                <span className="badge bg-secondary me-2">
                                                    {share.doctorSpecialization}
                                                </span>
                                                <span className="badge bg-info me-2">
                                                    {share.permissionLevel}
                                                </span>
                                            </p>
                                            <small className="text-muted">
                                                <i className="bi bi-folder2 me-1"></i>
                                                Record #{share.healthRecordID} |
                                                <i className="bi bi-calendar3 ms-2 me-1"></i>
                                                Shared: {new Date(share.consentGivenAt).toLocaleDateString()}
                                                {share.expiryDate && (
                                                    <>
                                                        {' | '}
                                                        <i className="bi bi-calendar-x ms-2 me-1"></i>
                                                        Expires: {new Date(share.expiryDate).toLocaleDateString()}
                                                    </>
                                                )}
                                            </small>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-danger ms-3"
                                            onClick={() => handleRevoke(share.shareID)}
                                        >
                                            <i className="bi bi-x-circle me-1"></i>
                                            Revoke
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ShareHealthRecords;