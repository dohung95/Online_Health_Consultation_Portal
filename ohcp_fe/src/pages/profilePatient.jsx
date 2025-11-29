import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, changePassword, changeEmail } from '../api/account'; // Import file API vừa tạo

export default function PatientProfile() {
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        medicalHistorySummary: '',
        insuranceProvider: '',
        insurancePolicyNumber: ''
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // 'info' hoặc 'security'

    // --- 1. TẢI DỮ LIỆU KHI MỞ TRANG ---
    useEffect(() => {
        if (token) {
            loadProfile();
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
            alert("Unable to load profile information.");
        } finally {
            setLoading(false);
        }
    };

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
            alert("Update error: " + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    // Kiểm tra xem có thay đổi không
    const hasChanges = () => {
        return (
            formData.fullName !== profile.fullName ||
            formData.phoneNumber !== profile.phoneNumber ||
            formData.dateOfBirth !== profile.dateOfBirth
        );
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-4 mb-4">
                {/* === Basic Information === */}
                <div className="col-12">
                    <div className="card h-100 border-primary">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-person-vcard me-2"></i>
                                Basic Information
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
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control bg-light"
                                        value={formData.email}
                                        disabled
                                    />
                                    <small className="text-muted">Go to Security tab to change email</small>
                                </div>
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
            alert("New password confirmation does not match!");
            return;
        }

        setChanging(true);
        try {
            await changePassword(token, passwords);
            alert("Password changed successfully! Please log in again.");
            logout(); // Đăng xuất để user đăng nhập lại với pass mới
        } catch (error) {
            alert("Error: " + (error.response?.data?.message || "Current password is incorrect."));
        } finally {
            setChanging(false);
        }
    };

    const handleEmailChange = async (e) => {
        e.preventDefault();

        if (!emailChange.newEmail || !emailChange.password) {
            alert("Please fill in all fields!");
            return;
        }

        setChangingEmail(true);
        try {
            await changeEmail(token, emailChange);
            alert("Email changed successfully! Please log in again.");
            logout(); // Đăng xuất để user đăng nhập lại với email mới
        } catch (error) {
            alert("Error: " + (error.response?.data?.message || "Failed to change email."));
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