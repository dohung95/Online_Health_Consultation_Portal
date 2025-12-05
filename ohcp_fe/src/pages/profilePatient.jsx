import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, changePassword, changeEmail } from '../api/account';
import { toast } from 'sonner';

export default function PatientProfile() {
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        city: '',
        country: '',
        bloodType: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
        preferredLanguage: '',
        preferredContactMethod: '',
        occupation: ''
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // 'info' hoặc 'security'

    // --- 1. TẢI DỮ LIỆU KHI MỞ TRANG ---
    useEffect(() => {
        if (token) {
            loadProfile();
            // loadHealthRecords();
        }
    }, [token]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await getProfile(token);
            // Format ngày sinh để hiển thị đúng trong input type="date"
            if (data.dateOfBirth) {
                data.dateOfBirth = new Date(data.dateOfBirth).toISOString().split('T')[0];
            }
            setProfile(data);
        } catch (error) {
            console.error("Error loading profile:", error);
            toast.error("Unable to load profile information.");
        } finally {
            setLoading(false);
        }
    };

    // Load profile data from API
    const loadProfileData = async () => {
        setLoading(true);
        try {
            const data = await getProfile(token);
            setProfile(data);
            setFormData({
                fullName: data.fullName || '',
                phoneNumber: data.phoneNumber || '',
                email: data.email || '',
                dateOfBirth: data.dateOfBirth?.split('T')[0] || '',
                gender: data.gender || '',
                bloodType: data.bloodType || '',
                address: data.address || '',
                city: data.city || '',
                country: data.country || '',
                emergencyContactName: data.emergencyContactName || '',
                emergencyContactPhone: data.emergencyContactPhone || '',
                emergencyContactRelationship: data.emergencyContactRelationship || '',
                preferredLanguage: data.preferredLanguage || '',
                preferredContactMethod: data.preferredContactMethod || '',
                occupation: data.occupation || ''
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
            // alert('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    // useEffect ở đây
    useEffect(() => {
        if (token) {
            loadProfileData();
        }
    }, [token]);

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="section py-5 Background_Schedule">
            <div className="row justify-content-center" style={{ paddingTop: '200px' }}>
                <div className="col-lg-10">
                    {/* Header */}
                    <div className="card shadow-sm mb-4 border-0 bg-primary text-white">
                        <div className="card-body p-4 d-flex align-items-center">
                            <img
                                src={profile.photoURL || `https://api.dicebear.com/9.x/initials/svg?seed=${profile.fullName}`}
                                className="rounded-circle border border-3 border-white me-3"
                                width="80" height="80" alt="Avatar"
                            />
                            <div>
                                <h2 className="h4 mb-0">{profile.fullName || "Name not updated"}</h2>
                                <p className="mb-0 opacity-75">{profile.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <ul className="nav nav-tabs nav-fill mb-4 bg-white rounded shadow-sm">
                        <li className="nav-item">
                            <button
                                className={`nav-link py-3 fw-bold ${activeTab === 'info' ? 'active text-primary' : 'text-muted'}`}
                                onClick={() => setActiveTab('info')}
                            >
                                <i className="bi bi-person-vcard me-2"></i>Personal Information
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link py-3 fw-bold ${activeTab === 'security' ? 'active text-danger' : 'text-muted'}`}
                                onClick={() => setActiveTab('security')}
                            >
                                <i className="bi bi-shield-lock me-2"></i>Security & Password
                            </button>
                        </li>
                    </ul>

                    {/* Content */}
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4">
                            {activeTab === 'info' ? (
                                <GeneralInfoForm profile={profile} token={token} onUpdate={loadProfile} />
                            ) : (
                                <SecurityForm token={token} logout={logout} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENT CON: FORM CẬP NHẬT THÔNG TIN ---
function GeneralInfoForm({ profile, token, onUpdate }) {
    const [formData, setFormData] = useState(profile);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Sync formData khi profile thay đổi
    useEffect(() => {
        setFormData(profile);
    }, [profile]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProfile(token, formData);
            // alert("Updated successfully!");
            setIsEditing(false); // Tắt chế độ edit sau khi save thành công
            if (onUpdate) onUpdate(); // Tải lại dữ liệu mới
        } catch (error) {
            console.error(error);
            toast.error("Update error: " + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    // Kiểm tra xem có thay đổi không
    const hasChanges = () => {
        return (
            formData.fullName !== profile.fullName ||
            formData.phoneNumber !== profile.phoneNumber ||
            formData.dateOfBirth !== profile.dateOfBirth ||
            formData.gender !== profile.gender ||
            formData.address !== profile.address ||
            formData.city !== profile.city ||
            formData.country !== profile.country ||
            formData.bloodType !== profile.bloodType ||
            formData.emergencyContactName !== profile.emergencyContactName ||
            formData.emergencyContactPhone !== profile.emergencyContactPhone ||
            formData.emergencyContactRelationship !== profile.emergencyContactRelationship ||
            formData.preferredLanguage !== profile.preferredLanguage ||
            formData.preferredContactMethod !== profile.preferredContactMethod ||
            formData.occupation !== profile.occupation
        );
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-4 mb-4">
                {/* === Card 1: Personal Information === */}
                <div className="col-md-4">
                    <div className="card h-100 border-primary">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-person-vcard me-2"></i>
                                Personal Information
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-6">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        required
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="col-6">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control bg-light"
                                        value={formData.email}
                                        disabled
                                    />
                                    <small className="text-muted">Go to Security tab</small>
                                </div>
                                <div className="col-6">
                                    <label className="form-label">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="col-6">
                                    <label className="form-label">Gender</label>
                                    <select
                                        className="form-select"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="col-6">
                                    <label className="form-label">Blood Type</label>
                                    <select
                                        className="form-select"
                                        name="bloodType"
                                        value={formData.bloodType}
                                        onChange={handleChange}
                                        disabled={!isEditing}
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

                                <div className="col-12">
                                    <label className="form-label">Address</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="col-6">
                                    <label className="form-label">City</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="form-label">Country</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === Card 2: Emergency Contact === */}
                <div className="col-md-4">
                    <div className="card h-100 border-danger">
                        <div className="card-header bg-danger text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-phone-vibrate me-2"></i>
                                Emergency Contact
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Contact Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="emergencyContactName"
                                    value={formData.emergencyContactName}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Contact Phone</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="emergencyContactPhone"
                                    value={formData.emergencyContactPhone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="mb-0">
                                <label className="form-label">Relationship</label>
                                <select
                                    className="form-select"
                                    name="emergencyContactRelationship"
                                    value={formData.emergencyContactRelationship}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                >
                                    <option value="">Select Relationship</option>
                                    <option value="Parent">Parent</option>
                                    <option value="Spouse">Spouse</option>
                                    <option value="Sibling">Sibling</option>
                                    <option value="Child">Child</option>
                                    <option value="Friend">Friend</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === Card 3: Preferences === */}
                <div className="col-md-4">
                    <div className="card h-100 border-success">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-gear me-2"></i>
                                Preferences
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Preferred Language</label>
                                <select
                                    className="form-select"
                                    name="preferredLanguage"
                                    value={formData.preferredLanguage}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                >
                                    <option value="">Select Language</option>
                                    <option value="Vietnamese">Vietnamese</option>
                                    <option value="English">English</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Preferred Contact Method</label>
                                <select
                                    className="form-select"
                                    name="preferredContactMethod"
                                    value={formData.preferredContactMethod}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                >
                                    <option value="">Select Method</option>
                                    <option value="Email">Email</option>
                                    <option value="SMS">SMS</option>
                                    <option value="Phone">Phone Call</option>
                                </select>
                            </div>
                            <div className="mb-0">
                                <label className="form-label">Occupation</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="occupation"
                                    value={formData.occupation}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* === Action Buttons === */}
            <div className="d-flex justify-content-end align-items-center">
                {!isEditing ? (
                    <button type="button" className="btn btn-primary px-4" onClick={() => setIsEditing(true)}>
                        <i className="bi bi-pencil me-2"></i>Edit Profile
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            className="btn btn-secondary px-4 me-2"
                            onClick={() => {
                                setIsEditing(false);
                                setFormData(profile);
                            }}
                        >
                            <i className="bi bi-x-circle me-2"></i>Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-success px-4"
                            disabled={saving || !hasChanges()}
                            style={{ opacity: (saving || !hasChanges()) ? 0.5 : 1 }}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-circle me-2"></i>
                                    Save Changes
                                </>
                            )}
                        </button>
                        {!hasChanges() && !saving && (
                            <small className="text-muted ms-2">No changes detected</small>
                        )}
                    </>
                )}
            </div>
        </form>
    );
}

// --- COMPONENT CON: FORM ĐỔI MẬT KHẨU VÀ EMAIL---
function SecurityForm({ token, logout }) {
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [changing, setChanging] = useState(false);
    const [emailChange, setEmailChange] = useState({ newEmail: '', password: '' });
    const [changingEmail, setChangingEmail] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmNewPassword) {
            toast.error("New password confirmation does not match!");
            return;
        }

        setChanging(true);
        try {
            await changePassword(token, passwords);
            toast.success("Password changed successfully! Please log in again.");
            logout(); // Đăng xuất để user đăng nhập lại với pass mới
        } catch (error) {
            toast.error("Error: " + (error.response?.data?.message || "Current password is incorrect."));
        } finally {
            setChanging(false);
        }
    };

    const handleEmailChange = async (e) => {
        e.preventDefault();

        if (!emailChange.newEmail || !emailChange.password) {
            toast.error("Please fill in all fields!");
            return;
        }

        setChangingEmail(true);
        try {
            await changeEmail(token, emailChange);
            toast.success("Email changed successfully! Please log in again.");
            logout(); // Đăng xuất để user đăng nhập lại với email mới
        } catch (error) {
            toast.error("Error: " + (error.response?.data?.message || "Failed to change email."));
        } finally {
            setChangingEmail(false);
        }
    };

    return (
        <div className="row g-4">
            {/* === Cột trái: Form Change Email === */}
            <div className="col-md-6">
                <form onSubmit={handleEmailChange} className="h-100">
                    <div className="card h-100 border-info">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-envelope-at me-2"></i>
                                Change Email
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-info mb-3">
                                <i className="bi bi-info-circle me-2"></i>
                                After changing email, you will need to log in again with the new email.
                            </div>

                            <div className="mb-3">
                                <label className="form-label">New Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={emailChange.newEmail}
                                    onChange={(e) => setEmailChange({ ...emailChange, newEmail: e.target.value })}
                                    placeholder="Enter new email"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={emailChange.password}
                                    onChange={(e) => setEmailChange({ ...emailChange, password: e.target.value })}
                                    placeholder="For verification"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-info w-100" disabled={changingEmail}>
                                {changingEmail ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-circle me-2"></i>
                                        Change Email
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* === Cột phải: Form Change Password === */}
            <div className="col-md-6">
                <form onSubmit={handleSubmit} className="h-100">
                    <div className="card h-100 border-danger">
                        <div className="card-header bg-danger text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-shield-lock me-2"></i>
                                Change Password
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-warning mb-3">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                After changing your password, you will need to log in again.
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwords.confirmNewPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmNewPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-danger w-100" disabled={changing}>
                                {changing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-shield-check me-2"></i>
                                        Change Password
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}


// import { healthRecordApi } from '../api/healthRecordApi';
// import DocumentViewerModal from '../components/DocumentViewerModal';

// <style>{`
//     .card-body::-webkit-scrollbar {
//         width: 8px;
//     }
//     .card-body::-webkit-scrollbar-track {
//         background: #f1f1f1;
//         border-radius: 10px;
//     }
//     .card-body::-webkit-scrollbar-thumb {
//         background: #888;
//         border-radius: 10px;
//     }
//     .card-body::-webkit-scrollbar-thumb:hover {
//         background: #555;
//     }
// `}</style>


// Health Records states
// const [healthRecords, setHealthRecords] = useState([]);
// const [loadingRecords, setLoadingRecords] = useState(false);
// const [selectedDocument, setSelectedDocument] = useState(null);
// const [showViewer, setShowViewer] = useState(false);
// const [filterCategory, setFilterCategory] = useState('all');
// const [searchQuery, setSearchQuery] = useState('');
// const [sortBy, setSortBy] = useState('newest');
// const API_BASE_URL = 'https://localhost:7267';

// const loadHealthRecords = async () => {
//     setLoadingRecords(true);
//     try {
//         const data = await healthRecordApi.getMyRecords();
//         console.log('🔍 Health Records Data:', data);
//         if (data && data.length > 0) {
//             console.log('📄 First Document:', data[0].documents?.[0]);
//         }
//         setHealthRecords(data);
//     } catch (error) {
//         console.error("Error loading health records:", error);
//     }
//     setLoadingRecords(false);
// };

// const getFilteredAndSortedRecords = () => {
//     let filtered = [...healthRecords];

//     // Apply category filter
//     if (filterCategory !== 'all') {
//         filtered = filtered.map(record => ({
//             ...record,
//             documents: record.documents?.filter(doc => doc.category === filterCategory)
//         })).filter(record => record.documents && record.documents.length > 0);
//     }

//     // Apply search
//     if (searchQuery.trim()) {
//         const query = searchQuery.toLowerCase();
//         filtered = filtered.map(record => ({
//             ...record,
//             documents: record.documents?.filter(doc =>
//                 doc.documentName?.toLowerCase().includes(query) ||
//                 doc.description?.toLowerCase().includes(query) ||
//                 doc.category?.toLowerCase().includes(query)
//             )
//         })).filter(record => record.documents && record.documents.length > 0);
//     }

//     // Apply sorting
//     if (sortBy === 'newest') {
//         filtered.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
//         filtered = filtered.map(record => ({
//             ...record,
//             documents: record.documents?.sort((a, b) =>
//                 new Date(b.uploadedAt) - new Date(a.uploadedAt)
//             )
//         }));
//     } else if (sortBy === 'oldest') {
//         filtered.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));
//         filtered = filtered.map(record => ({
//             ...record,
//             documents: record.documents?.sort((a, b) =>
//                 new Date(a.uploadedAt) - new Date(b.uploadedAt)
//             )
//         }));
//     }

//     return filtered;
// };

// const handleViewDocument = (document) => {
//     setSelectedDocument(document);
//     setShowViewer(true);
// };

// const handleCloseViewer = () => {
//     setShowViewer(false);
//     setSelectedDocument(null);
// };

{/* thông tin y tế */ }
{/* ======================================== */ }
{/* HEALTH RECORDS SECTION - SINGLE CARD */ }
{/* ======================================== */ }
// <div className="mt-5">
//     <div className="card border-0 shadow-sm">
//         {/* Header */}
//         <div className="card-header bg-primary text-white py-3">
//             <h4 className="mb-0">
//                 <i className="bi bi-file-earmark-medical me-2"></i>
//                 Medical Documents & Health Records
//             </h4>
//         </div>

//         {/* Filters & Search */}
//         <div className="card-body border-bottom">
//             <div className="row g-3">
//                 {/* Search */}
//                 <div className="col-md-6">
//                     <label className="form-label fw-bold">
//                         <i className="bi bi-search me-2"></i>Search
//                     </label>
//                     <input
//                         type="text"
//                         className="form-control"
//                         placeholder="Search by name, description..."
//                         value={searchQuery}
//                         onChange={e => setSearchQuery(e.target.value)}
//                     />
//                 </div>

//                 {/* Category Filter */}
//                 <div className="col-md-3">
//                     <label className="form-label fw-bold">
//                         <i className="bi bi-funnel me-2"></i>Category
//                     </label>
//                     <select
//                         className="form-select"
//                         value={filterCategory}
//                         onChange={e => setFilterCategory(e.target.value)}
//                     >
//                         <option value="all">All Categories</option>
//                         <option value="X-Ray">🩻 X-Ray</option>
//                         <option value="CT-Scan">🔬 CT Scan</option>
//                         <option value="MRI">🧲 MRI</option>
//                         <option value="Blood-Test">💉 Blood Test</option>
//                         <option value="Lab-Report">🧪 Lab Report</option>
//                         <option value="Prescription">💊 Prescription</option>
//                     </select>
//                 </div>

//                 {/* Sort */}
//                 <div className="col-md-3">
//                     <label className="form-label fw-bold">
//                         <i className="bi bi-sort-down me-2"></i>Sort By
//                     </label>
//                     <select
//                         className="form-select"
//                         value={sortBy}
//                         onChange={e => setSortBy(e.target.value)}
//                     >
//                         <option value="newest">Newest First</option>
//                         <option value="oldest">Oldest First</option>
//                     </select>
//                 </div>
//             </div>
//         </div>

//         {/* Document List */}
//         {/* Document List - Max 7 items visible with scroll */}
//         <div className="card-body" style={{
//             maxHeight: '1000px',  // Mỗi item ~200px, 5 items = 1000px
//             overflowY: 'auto',
//             overflowX: 'hidden'
//         }}>
//             {loadingRecords ? (
//                 <div className="text-center py-5">
//                     <div className="spinner-border text-primary"></div>
//                     <p className="mt-2 text-muted">Loading health records...</p>
//                 </div>
//             ) : getFilteredAndSortedRecords().length === 0 ? (
//                 <div className="alert alert-light border text-center">
//                     <i className="bi bi-inbox me-2"></i>
//                     {searchQuery || filterCategory !== 'all'
//                         ? 'No documents match your filters.'
//                         : 'No health records found.'}
//                 </div>
//             ) : (
//                 getFilteredAndSortedRecords().map(record => (
//                     <div key={record.healthRecordID} className="mb-4">
//                         {/* Header cho group documents */}
//                         <div className="d-flex justify-content-between align-items-center mb-3 px-2">
//                             <h6 className="mb-0 text-primary fw-bold">
//                                 <i className="bi bi-calendar-event me-2"></i>
//                                 Documents Collection
//                             </h6>
//                             <span className="badge bg-primary">
//                                 {record.documents?.length || 0} file(s)
//                             </span>
//                         </div>

//                         {/* List documents */}
//                         <div className="row g-3">
//                             {record.documents?.map(doc => (
//                                 <div key={doc.documentID} className="col-12">
//                                     <div className="card border-0 shadow-sm hover-shadow" style={{ transition: 'all 0.3s ease' }}>
//                                         <div className="card-body p-4">
//                                             <div className="row align-items-center">
//                                                 {/* COL 1: PREVIEW IMAGE - LỚN HƠN */}
//                                                 <div className="col-md-2 col-sm-3 text-center mb-3 mb-md-0">
//                                                     {doc.documentType?.toLowerCase().includes('pdf') ? (
//                                                         <div className="bg-light rounded p-3 d-inline-block">
//                                                             <i className="bi bi-file-pdf text-danger" style={{ fontSize: '4rem' }}></i>
//                                                         </div>
//                                                     ) : (
//                                                         <img
//                                                             src={`${API_BASE_URL}${doc.fileUrl}`}
//                                                             alt={doc.documentName}
//                                                             className="rounded shadow-sm"
//                                                             style={{
//                                                                 width: '120px',
//                                                                 height: '120px',
//                                                                 objectFit: 'cover',
//                                                                 cursor: 'pointer',
//                                                                 border: '3px solid #e9ecef'
//                                                             }}
//                                                             onClick={() => window.open(`${API_BASE_URL}${doc.fileUrl}`, '_blank')}

//                                                         />
//                                                     )}
//                                                 </div>

//                                                 {/* COL 2: THÔNG TIN DOCUMENT */}
//                                                 <div className="col-md-7 col-sm-6">
//                                                     {/* Tên file */}
//                                                     <h5 className="mb-2 fw-bold text-dark">
//                                                         <i className="bi bi-file-earmark-text me-2 text-primary"></i>
//                                                         {doc.documentName}
//                                                     </h5>

//                                                     {/* Category badge */}
//                                                     {doc.category && (
//                                                         <div className="mb-2">
//                                                             <span className="badge bg-primary px-3 py-2" style={{ fontSize: '0.85rem' }}>
//                                                                 {doc.category}
//                                                             </span>
//                                                         </div>
//                                                     )}

//                                                     {/* Ngày upload */}
//                                                     <div className="text-muted mb-2">
//                                                         <i className="bi bi-clock-history me-2"></i>
//                                                         <small>
//                                                             Uploaded: {new Date(doc.uploadedAt).toLocaleString('vi-VN', {
//                                                                 hour: '2-digit',
//                                                                 minute: '2-digit',
//                                                                 day: '2-digit',
//                                                                 month: 'short',
//                                                                 year: 'numeric'
//                                                             })}
//                                                         </small>
//                                                     </div>

//                                                     {/* Description */}
//                                                     {doc.description && (
//                                                         <div className="bg-light rounded p-3 mt-3" style={{
//                                                             maxHeight: '100px',
//                                                             overflowY: 'auto',
//                                                             overflowX: 'hidden'
//                                                         }}>
//                                                             <small className="text-muted d-block mb-1">
//                                                                 <i className="bi bi-card-text me-1"></i>
//                                                                 <strong>Description:</strong>
//                                                             </small>
//                                                             <p className="mb-0 text-dark" style={{
//                                                                 wordBreak: 'break-word',
//                                                                 whiteSpace: 'pre-wrap'
//                                                             }}>
//                                                                 {doc.description}
//                                                             </p>
//                                                         </div>
//                                                     )}
//                                                 </div>

//                                                 {/* COL 3: ACTION BUTTONS */}
//                                                 <div className="col-md-3 col-sm-3 text-center text-md-end">
//                                                     <button
//                                                         className="btn btn-primary px-4 py-2 w-100 mb-2"
//                                                         onClick={() => handleViewDocument(doc)}
//                                                     >
//                                                         <i className="bi bi-eye me-2"></i>
//                                                         View Document
//                                                     </button>
//                                                     <button
//                                                         className="btn btn-outline-secondary px-4 py-2 w-100"
//                                                         onClick={() => window.open(doc.fileUrl, '_blank')}
//                                                     >
//                                                         <i className="bi bi-download me-2"></i>
//                                                         Download
//                                                     </button>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 ))
//             )}
//         </div>
//     </div>
// </div>

// {/* Document Viewer Modal */}
// {selectedDocument && (
//     <DocumentViewerModal
//         show={showViewer}
//         onHide={handleCloseViewer}
//         document={selectedDocument}
//     />
// )}