import React, { useEffect, useState } from 'react';
import { shareApi } from '../api/shareRecordApi';
import { doctorService } from '../api/doctorApi';
import { healthRecordApi } from '../api/healthRecordApi';
import { toast } from 'sonner';

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
    const [specialtyFilter, setSpecialtyFilter] = useState(''); // Filter theo specialty
    const [specialties, setSpecialties] = useState([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [shareAll, setShareAll] = useState(true);
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    useEffect(() => {
        loadData();
        loadSpecialties();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load tuần tự để tránh race condition
            const doctorsData = await doctorService.getAllDoctors();
            setDoctors(doctorsData || []); // Set ngay để UI update sớm

            const recordsData = await healthRecordApi.getMyRecords();
            setHealthRecords(recordsData || []);

            const sharesData = await shareApi.getMyShares();
            setShares(sharesData || []);
        } catch (error) {
            console.error("❌ Error loading data:", error);
            toast.error(`Failed to load data: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadSpecialties = async () => {
        try {
            const data = await doctorService.getSpecialties();
            setSpecialties(data);
        } catch (error) {
            console.error("Error loading specialties:", error);
            setSpecialties([]);
        }
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
        // VALIDATION: If advanced mode + no docs selected
        if (!shareAll && selectedDocuments.length === 0) {
            toast.warning('Please select at least one document to share, or check "Select All"');
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
            toast.success(`Shared successfully! ${shareType} shared.`);
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
    let errorMessage = 'Unknown error occurred';
    
    if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
        } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
        } else {
            errorMessage = JSON.stringify(error.response.data);
        }
    } else {
        errorMessage = error.message;
    }
    toast.error(`Failed to share: ${errorMessage}`);
}
    };

    const handleRevoke = async (shareId) => {
        if (!window.confirm('Are you sure you want to revoke access to this doctor?')) {
            return;
        }
        try {
            await shareApi.revokeShare(shareId);
            toast.success('Access revoked successfully');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Failed to revoke access');
        }
    };

    const filteredDoctors = doctors.filter(doc => {
        // Filter 1: Search theo tên bác sĩ
        const matchesName = doc.fullName?.toLowerCase().includes(searchDoctor.toLowerCase());

        // Filter 2: Filter theo specialty (nếu có chọn)
        const matchesSpecialty = specialtyFilter === '' ||
            doc.specialty === specialtyFilter;

        // Kết hợp cả 2 điều kiện (AND)
        return matchesName && matchesSpecialty;
    });

    // Group records by exact date
    const groupRecordsByDate = (records) => {
        const groups = {};
        records.forEach(record => {
            const dateKey = new Date(record.lastUpdated).toLocaleDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(record);
        });

        // Convert to array and sort by date (newest first)
        return Object.entries(groups)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .map(([date, records]) => ({ date, records }));
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border" role="status"></div>
            </div>
        );
    }
    return (
        <div className="Background_Doctors">
            <style>{`
            .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
            .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
            .cursor-pointer { cursor: pointer; }
            .doc-checkbox:checked + div { background-color: #e7f1ff; border-color: #0d6efd; }
            .avatar-circle { width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 50%; }
            .transition-all {transition: all 0.2s ease;}
        `}</style>

            <div className="container">
                {/* HEADER SECTION */}
                <div className="text-center mb-5">
                    <h2 className="fw-bold text-dark mb-2">
                        <span className="text-primary"><i className="bi bi-shield-check"></i></span> Health Record Sharing
                    </h2>
                    <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
                        Securely share your medical history with trusted healthcare professionals. You retain full control over your data.
                    </p>
                </div>

                <div className="row g-4">
                    {/* --- LEFT COLUMN: SHARE FORM --- */}
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                            <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
                                <div className="d-flex align-items-center">
                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3">
                                        <i className="bi bi-person-plus-fill fs-4"></i>
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-0 text-dark">Grant New Access</h5>
                                        <small className="text-muted">Select a record and doctor to share with</small>
                                    </div>
                                </div>
                            </div>

                            <div className="card-body p-4">
                                <form onSubmit={handleShare}>
                                    {/* STEP 1: SELECT RECORD */}
                                    <div className="mb-4">
                                        <label className="form-label fw-bold text-uppercase text-secondary small">
                                            <i className="bi bi-1-circle-fill me-2"></i>Select Health Record
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-end-0">
                                                <i className="bi bi-folder2-open text-primary"></i>
                                            </span>
                                            <div className="border rounded-3 bg-light p-3" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                                {healthRecords.length === 0 ? (
                                                    <p className="text-muted text-center mb-0">No records found</p>
                                                ) : (
                                                    groupRecordsByDate(healthRecords).map((group, groupIdx) => (
                                                        <div key={groupIdx} className="mb-3">
                                                            {/* Date Header */}
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="bi bi-calendar3 text-primary me-2"></i>
                                                                <span className="fw-bold text-dark small">{group.date}</span>
                                                                <span className="badge bg-secondary ms-2">{group.records.length}</span>
                                                            </div>

                                                            {/* Records for this date */}
                                                            {group.records.map(record => (
                                                                <label
                                                                    key={record.healthRecordID}
                                                                    className="d-block mb-2 cursor-pointer"
                                                                    onClick={(e) => {
                                                                        // ✅ Cho phép click lại để deselect
                                                                        if (selectedRecord === record.healthRecordID.toString()) {
                                                                            e.preventDefault();
                                                                            setSelectedRecord('');
                                                                            setShowAdvanced(false);
                                                                            setShareAll(true);
                                                                            setSelectedDocuments([]);
                                                                        }
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name="selectedRecord"
                                                                        value={record.healthRecordID}
                                                                        checked={selectedRecord === record.healthRecordID.toString()}
                                                                        onChange={handleRecordChange}
                                                                        className="d-none"
                                                                        required
                                                                    />
                                                                    <div className={`p-2 rounded-3 border d-flex align-items-center transition-all ${selectedRecord === record.healthRecordID.toString()
                                                                        ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                                                                        : 'border bg-white hover-lift'
                                                                        }`}>
                                                                        <i className={`bi bi-folder2-open me-2 fs-5 ${selectedRecord === record.healthRecordID.toString()
                                                                            ? 'text-primary'
                                                                            : 'text-secondary'
                                                                            }`}></i>
                                                                        <div className="flex-grow-1 small">
                                                                            <span className="fw-bold">Record #{record.healthRecordID}</span>
                                                                            <span className="text-muted"> — {record.documents?.length || 0} documents</span>
                                                                        </div>
                                                                        {selectedRecord === record.healthRecordID.toString() && (
                                                                            <i className="bi bi-check-circle-fill text-primary"></i>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            ))}

                                                            {/* Separator */}
                                                            {groupIdx < groupRecordsByDate(healthRecords).length - 1 && (
                                                                <hr className="my-2" />
                                                            )}
                                                        </div>
                                                    ))
                                                )}


                                            </div>
                                        </div>
                                        {healthRecords.length === 0 && (
                                            <div className="alert alert-warning mt-2 d-flex align-items-center p-2 small">
                                                <i className="bi bi-exclamation-circle me-2"></i>
                                                No records found. Please upload documents first.
                                            </div>
                                        )}
                                    </div>

                                    {/* ADVANCED DOC SELECTION */}
                                    {selectedRecord && (
                                        <div className="mb-4 bg-light p-3 rounded-3 border">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="fw-bold text-dark small">Included Documents:</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-link text-decoration-none"
                                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                                >
                                                    {showAdvanced ? 'Hide Details' : 'Customize'}
                                                </button>
                                            </div>

                                            {!showAdvanced ? (
                                                <div className="d-flex align-items-center text-success bg-white p-2 rounded border">
                                                    <i className="bi bi-check-circle-fill me-2"></i>
                                                    <span className="fw-semibold small">Sharing Entire Record ({getCurrentDocuments().length} files)</span>
                                                </div>
                                            ) : (
                                                <div className="bg-white p-2 rounded border animate__animated animate__fadeIn">
                                                    <div className="form-check form-switch mb-2 pb-2 border-bottom">
                                                        <input
                                                            className="form-check-input cursor-pointer"
                                                            type="checkbox"
                                                            id="shareAllSwitch"
                                                            checked={shareAll}
                                                            onChange={handleShareAllToggle}
                                                        />
                                                        <label className="form-check-label fw-bold cursor-pointer" htmlFor="shareAllSwitch">
                                                            Select All (Share Entire Record)
                                                        </label>
                                                    </div>
                                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="pe-1">
                                                        {getCurrentDocuments().length > 0 ? (
                                                            getCurrentDocuments().map((doc, idx) => (
                                                                <label key={idx} className="d-block mb-2 cursor-pointer position-relative">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="doc-checkbox d-none"
                                                                        checked={!shareAll && selectedDocuments.includes(doc.documentID)}
                                                                        onChange={handleDocumentToggle}
                                                                        value={doc.documentID}
                                                                        disabled={shareAll}
                                                                    />
                                                                    <div className={`p-2 rounded border d-flex align-items-center ${shareAll ? 'bg-light text-muted' : 'hover-lift'}`}>
                                                                        <i className="bi bi-file-earmark-text text-secondary me-2 fs-5"></i>
                                                                        <div className="small lh-sm flex-grow-1">
                                                                            {/* Title: Category + Type */}
                                                                            <div className="fw-bold d-flex align-items-center">
                                                                                <span className="badge bg-info bg-opacity-10 text-info me-2 fw-normal" style={{ fontSize: '0.7rem' }}>
                                                                                    {doc.category || 'General'}
                                                                                </span>
                                                                                {doc.documentType || 'Document'}
                                                                            </div>

                                                                            {/* Details: Date + Filename */}
                                                                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                                                <i className="bi bi-calendar3 me-1"></i>
                                                                                {doc.documentDate ? new Date(doc.documentDate).toLocaleDateString() : 'No date'}
                                                                                {' • '}
                                                                                <i className="bi bi-file-text me-1"></i>
                                                                                {doc.fileName}
                                                                            </div>
                                                                        </div>

                                                                        {/* Checkmark when selected */}
                                                                        {!shareAll && selectedDocuments.includes(doc.documentID) && (
                                                                            <i className="bi bi-check-circle-fill text-primary ms-2"></i>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            ))
                                                        ) : (
                                                            <p className="text-muted small text-center">No documents available.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Warning when nothing selected */}
                                            {!shareAll && selectedDocuments.length === 0 && showAdvanced && (
                                                <div className="text-danger small mt-2">
                                                    <i className="bi bi-exclamation-triangle me-1"></i> Please select at least one document.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP 2: SELECT DOCTOR & FILTER */}
                                    <div className="mb-4">
                                        <label className="form-label fw-bold text-uppercase text-secondary small">
                                            <i className="bi bi-2-circle-fill me-2"></i>Find a Doctor
                                        </label>

                                        {/* Filter Tools Row */}
                                        <div className="row g-2 mb-2">
                                            <div className="col-md-6">
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Search doctor's name..."
                                                        value={searchDoctor}
                                                        onChange={e => setSearchDoctor(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="input-group">
                                                    <span className="input-group-text bg-white">
                                                        <i className="bi bi-funnel text-muted"></i>
                                                    </span>
                                                    <select
                                                        className="form-select"
                                                        value={specialtyFilter}
                                                        onChange={e => setSpecialtyFilter(e.target.value)}
                                                    >
                                                        <option value="">All Specialties</option>
                                                        {specialties.map((spec, index) => (
                                                            <option key={index} value={spec}>{spec}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Clear Filter Button */}
                                        {(searchDoctor || specialtyFilter) && (
                                            <div className="d-flex justify-content-end mb-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-link btn-sm text-decoration-none text-muted p-0"
                                                    onClick={() => { setSearchDoctor(''); setSpecialtyFilter(''); }}
                                                >
                                                    <i className="bi bi-x-circle me-1"></i> Clear Filters
                                                </button>
                                            </div>
                                        )}

                                        {/* Doctor List */}
                                        <div className="border rounded-3 p-3 bg-light" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {filteredDoctors.length === 0 ? (
                                                <p className="text-muted text-center mb-0">No doctors match your filters</p>
                                            ) : (
                                                filteredDoctors.map(doc => (
                                                    <label
                                                        key={doc.doctorID}
                                                        className="d-block mb-2 cursor-pointer position-relative"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="selectedDoctor"
                                                            value={doc.doctorID}
                                                            checked={selectedDoctor === doc.doctorID.toString()}
                                                            onChange={e => setSelectedDoctor(e.target.value)}
                                                            className="d-none"
                                                            required
                                                        />
                                                        <div className={`p-3 rounded-3 border-2 d-flex align-items-center transition-all ${selectedDoctor === doc.doctorID.toString()
                                                            ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                                                            : 'border bg-white hover-lift'
                                                            }`}>
                                                            {/* Avatar */}
                                                            <div className={`rounded-circle me-3 d-flex align-items-center justify-content-center fw-bold ${selectedDoctor === doc.doctorID.toString()
                                                                ? 'bg-primary text-white'
                                                                : 'bg-secondary bg-opacity-10 text-secondary'
                                                                }`} style={{ width: '45px', height: '45px' }}>
                                                                {doc.fullName?.charAt(0) || 'D'}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-grow-1">
                                                                <div className="fw-bold text-dark">{doc.fullName}</div>
                                                                <small className="text-muted">{doc.specialization}</small>
                                                            </div>

                                                            {/* Check Icon */}
                                                            {selectedDoctor === doc.doctorID.toString() && (
                                                                <i className="bi bi-check-circle-fill text-primary fs-5"></i>
                                                            )}
                                                        </div>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* STEP 3: PERMISSIONS */}
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold text-secondary small">Expiry Date (Optional)</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light"><i className="bi bi-calendar-event"></i></span>
                                                <input
                                                    type="date"
                                                    className="form-control bg-light"
                                                    value={expiryDate}
                                                    onChange={e => setExpiryDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm hover-lift"
                                        disabled={!selectedRecord || !selectedDoctor || (!shareAll && selectedDocuments.length === 0)}
                                    >
                                        <i className="bi bi-share-fill me-2"></i>
                                        {shareAll ? 'Share Entire Record' : `Share ${selectedDocuments.length} Selected Document(s)`}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: ACTIVE SHARES --- */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                            <div className="card-header bg-white border-bottom py-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fw-bold text-dark">
                                        <i className="bi bi-people-fill text-success me-2"></i>
                                        Active Shares
                                    </h5>
                                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3">
                                        {shares.length} Active
                                    </span>
                                </div>
                            </div>

                            <div className="card-body p-0 overflow-auto" style={{ maxHeight: '700px' }}>
                                {shares.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="mb-3 text-muted opacity-25">
                                            <i className="bi bi-inbox fs-1"></i>
                                        </div>
                                        <p className="text-muted">No records shared yet.</p>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {shares.map(share => (
                                            <div key={share.shareID} className="list-group-item p-3 hover-lift border-bottom">
                                                <div className="d-flex align-items-start">
                                                    {/* Avatar Placeholder */}
                                                    <div className="avatar-circle bg-primary text-white flex-shrink-0 me-3 shadow-sm">
                                                        {share.doctorName?.charAt(0) || 'D'}
                                                    </div>

                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h6 className="fw-bold text-dark mb-0">{share.doctorName}</h6>
                                                                <div className="small text-muted">{share.doctorSpecialization}</div>
                                                            </div>
                                                            <span className={`badge rounded-pill ${share.permissionLevel === 'View' ? 'bg-secondary' : 'bg-warning text-dark'}`}>
                                                                {share.permissionLevel}
                                                            </span>
                                                        </div>

                                                        <div className="mt-2 p-2 bg-light rounded-3 small border">
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <span className="text-muted"><i className="bi bi-folder2 me-1"></i>Record ID:</span>
                                                                <span className="fw-bold">#{share.healthRecordID}</span>
                                                            </div>
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <span className="text-muted"><i className="bi bi-clock me-1"></i>Shared On:</span>
                                                                <span>{new Date(share.consentGivenAt).toLocaleDateString()}</span>
                                                            </div>
                                                            {share.expiryDate && (
                                                                <div className="d-flex justify-content-between text-danger fw-semibold">
                                                                    <span><i className="bi bi-hourglass-bottom me-1"></i>Expires:</span>
                                                                    <span>{new Date(share.expiryDate).toLocaleDateString()}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            className="btn btn-outline-danger btn-sm w-100 mt-2 rounded-pill"
                                                            onClick={() => handleRevoke(share.shareID)}
                                                        >
                                                            <i className="bi bi-x-circle me-1"></i> Revoke Access
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        // </div>
    );
};
export default ShareHealthRecords;