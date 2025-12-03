import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Modal, Button } from 'react-bootstrap';
import '../Css/Sign_up.css';

export function Sign_up() {
    const navigate = useNavigate();
    const { register, token, roles } = useAuth();
    const [username, setUsername] = useState('');
    const [phonenumber, setPhonenumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
    const [showUsernameTooltip, setShowUsernameTooltip] = useState(false);
    const [showEmailTooltip, setShowEmailTooltip] = useState(false);
    const [showPhoneTooltip, setShowPhoneTooltip] = useState(false);
    const [showConfirmPasswordTooltip, setShowConfirmPasswordTooltip] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const role = "patient";

    // Password validation checks
    const passwordRequirements = {
        minLength: password.length >= 6,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[^a-zA-Z0-9\s]/.test(password),
        hasMatch: password === confirmPassword && password.length > 0,
        notSameAsEmail: password.toLowerCase() !== email.toLowerCase() && password.length > 0,
        notSameAsUsername: password.toLowerCase() !== username.toLowerCase() && password.length > 0
    };

    // Redirect if already logged in with valid token
    useEffect(() => {
        if (token && roles && roles.length > 0) {
            // User is already logged in, redirect to appropriate page
            console.log('User already logged in, redirecting from register...');

            // Navigate based on role
            if (roles.some(r => String(r).trim().toLowerCase() === 'admin')) {
                navigate('/admin', { replace: true });
            } else if (roles.some(r => String(r).trim().toLowerCase() === 'doctor')) {
                navigate('/doctor-page', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    }, [token, roles, navigate]);

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        // Reset form
        setUsername('');
        setEmail('');
        setPhonenumber('');
        setPassword('');
        setConfirmPassword('');
        // Hoặc navigate về login page
        // navigate('/login');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (phonenumber.length < 8 || phonenumber.length > 15) {
            setError('Phone number must be between 8 and 15 digits');
            return;
        }

        if (!/^[0-9]+$/.test(phonenumber)) {
            setError('Phone number must contain only digits');
            return;
        }

        setLoading(true);

        try {
            await register(username, phonenumber, email, password, confirmPassword, role);
            // Hiển thị modal thay vì navigate ngay
            setShowSuccessModal(true);
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <div className='Background_Sign_Up'>
                <div className='signup-container container'>
                    <h2>Register</h2>
                    {error && (
                        <div className='error-message'>
                            <i className="bi bi-exclamation-circle-fill" style={{ fontSize: '18px' }}></i>
                            <span>{error}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} noValidate>
                        {/* Row 1: Username + Email */}
                        <div className="form-row">
                            <div>
                                <label>
                                    User Name:
                                    <span
                                        className='tooltip-container'
                                        onMouseEnter={() => setShowUsernameTooltip(true)}
                                        onMouseLeave={() => setShowUsernameTooltip(false)}
                                    >
                                        <span style={{ color: '#dc3545', fontSize: '18px', fontWeight: 'bold' }}>*</span>
                                        {showUsernameTooltip && (
                                            <div className='tooltip'>
                                                <div className='tooltip-arrow'></div>
                                                <div>
                                                    <strong style={{ display: 'block', marginBottom: '6px' }}>Username Rules:</strong>
                                                    <div className='requirement-item'>
                                                        <i className="bi bi-check-circle" style={{ color: '#3cb1e6' }}></i>
                                                        <span>Letters (A-Z, a-z)</span>
                                                    </div>
                                                    <div className='requirement-item'>
                                                        <i className="bi bi-check-circle" style={{ color: '#3cb1e6' }}></i>
                                                        <span>Numbers (0-9)</span>
                                                    </div>
                                                    <div className='requirement-item'>
                                                        <i className="bi bi-check-circle" style={{ color: '#3cb1e6' }}></i>
                                                        <span>Spaces allowed</span>
                                                    </div>
                                                    <div className='requirement-item'>
                                                        <i className="bi bi-x-circle" style={{ color: '#dc3545' }}></i>
                                                        <span>No special characters</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                    className='signup-input'
                                />
                                {/* Real-time username validation */}
                                {username.length > 0 && !/^[a-zA-Z0-9 ]+$/.test(username) && (
                                    <div style={{
                                        color: '#dc3545',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <i className="bi bi-exclamation-circle"></i>
                                        <span>Only letters, numbers, and spaces allowed</span>
                                    </div>
                                )}
                                {username.length > 0 && /^[a-zA-Z0-9 ]+$/.test(username) && (
                                    <div style={{
                                        color: '#4caf50',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <i className="bi bi-check-circle-fill"></i>
                                        <span>Valid username</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label>
                                    Email:
                                    <span
                                        className='tooltip-container'
                                        onMouseEnter={() => setShowEmailTooltip(true)}
                                        onMouseLeave={() => setShowEmailTooltip(false)}
                                    >
                                        <span style={{ color: '#dc3545', fontSize: '18px', fontWeight: 'bold' }}>*</span>
                                        {showEmailTooltip && (
                                            <div className='tooltip'>
                                                <div className='tooltip-arrow'></div>
                                                <div>
                                                    <strong style={{ display: 'block', marginBottom: '6px' }}>Email Requirements:</strong>
                                                    <span style={{ fontSize: '12px', lineHeight: '1.6' }}>
                                                        Please provide a valid email address.
                                                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                                                            <li>Must be in format: <code style={{ backgroundColor: '#f0f0f0', padding: '2px 4px', borderRadius: '3px' }}>user@domain.com</code></li>
                                                            <li>Used for account verification</li>
                                                            <li>Used for important notifications</li>
                                                            <li>Used for password recovery</li>
                                                        </ul>
                                                        {email.length > 0 && (
                                                            <div style={{
                                                                marginTop: '8px',
                                                                fontSize: '11px',
                                                                color: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '#4caf50' : '#dc3545'
                                                            }}>
                                                                Format: {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Valid ✓' : 'Invalid ✗'}
                                                            </div>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className='signup-input'
                                />
                                {/* Real-time email validation */}
                                {email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                                    <div style={{
                                        color: '#dc3545',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <i className="bi bi-exclamation-circle"></i>
                                        <span>Please enter a valid email format (e.g., user@domain.com)</span>
                                    </div>
                                )}
                                {email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                                    <div style={{
                                        color: '#4caf50',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <i className="bi bi-check-circle-fill"></i>
                                        <span>Valid email format</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Phone + Password */}
                        <div className='form-row'>
                            <div>
                                <label>
                                    Phone Number:
                                    <span
                                        className='tooltip-container'
                                        onMouseEnter={() => setShowPhoneTooltip(true)}
                                        onMouseLeave={() => setShowPhoneTooltip(false)}
                                    >
                                        <span style={{ color: '#dc3545', fontSize: '18px', fontWeight: 'bold' }}>*</span>
                                        {showPhoneTooltip && (
                                            <div className='tooltip'>
                                                <div className='tooltip-arrow'></div>
                                                <div>
                                                    <strong style={{ display: 'block', marginBottom: '6px', color: '#ffc107' }}>⚠️ Important:</strong>
                                                    <span style={{ fontSize: '12px', lineHeight: '1.6' }}>
                                                        Please provide a real, active phone number.
                                                        <div className='form-row'>
                                                            <div>• <strong>Length:</strong> 6-20 digits</div>
                                                            <div>• Appointment reminders</div>
                                                            <div>• <strong>Format:</strong> Numbers only</div>
                                                            <div>• Emergency contact</div>
                                                            <div></div>
                                                            <div>• Account verification</div>
                                                        </div>
                                                        {phonenumber.length > 0 && (
                                                            <div style={{
                                                                marginTop: '8px',
                                                                fontSize: '11px',
                                                                color: phonenumber.length >= 8 && phonenumber.length <= 15 ? '#4caf50' : '#dc3545'
                                                            }}>
                                                                Current: {phonenumber.length} digits
                                                                {phonenumber.length >= 8 && phonenumber.length <= 15 ? ' ✓' : ' ✗'}
                                                            </div>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={phonenumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setPhonenumber(value);
                                    }}
                                    disabled={loading}
                                    className='signup-input'
                                />
                                {/* Real-time phone validation */}
                                {phonenumber.length > 0 && (phonenumber.length < 8 || phonenumber.length > 15) && (
                                    <div style={{
                                        color: '#dc3545',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <i className="bi bi-exclamation-circle"></i>
                                        <span>Phone number must be 8-15 digits (Current: {phonenumber.length})</span>
                                    </div>
                                )}
                                {phonenumber.length >= 8 && phonenumber.length <= 15 && (
                                    <div style={{
                                        color: '#4caf50',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <i className="bi bi-check-circle-fill"></i>
                                        <span>Valid phone number ({phonenumber.length} digits)</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label>
                                    Password:
                                    <span
                                        className='tooltip-container'
                                        onMouseEnter={() => setShowPasswordTooltip(true)}
                                        onMouseLeave={() => setShowPasswordTooltip(false)}
                                    >
                                        <span style={{ color: '#dc3545', fontSize: '18px', fontWeight: 'bold' }}>*</span>
                                        {showPasswordTooltip && (
                                            <div className='tooltip'>
                                                <div className='tooltip-arrow'></div>
                                                <strong style={{ display: 'block', marginBottom: '8px' }}>Password Requirements:</strong>

                                                <div className='requirement-item'>
                                                    <i className={`bi bi-${passwordRequirements.minLength ? 'check-circle-fill' : 'circle'}`}
                                                        style={{ color: passwordRequirements.minLength ? '#4caf50' : '#ccc' }}></i>
                                                    <span>At least 6 characters</span>
                                                </div>

                                                <div className='requirement-item'>
                                                    <i className={`bi bi-${passwordRequirements.hasUppercase ? 'check-circle-fill' : 'circle'}`}
                                                        style={{ color: passwordRequirements.hasUppercase ? '#4caf50' : '#ccc' }}></i>
                                                    <span>Uppercase letter (A-Z)</span>
                                                </div>

                                                <div className='requirement-item'>
                                                    <i className={`bi bi-${passwordRequirements.hasLowercase ? 'check-circle-fill' : 'circle'}`}
                                                        style={{ color: passwordRequirements.hasLowercase ? '#4caf50' : '#ccc' }}></i>
                                                    <span>Lowercase letter (a-z)</span>
                                                </div>

                                                <div className='requirement-item'>
                                                    <i className={`bi bi-${passwordRequirements.hasNumber ? 'check-circle-fill' : 'circle'}`}
                                                        style={{ color: passwordRequirements.hasNumber ? '#4caf50' : '#ccc' }}></i>
                                                    <span>Number (0-9)</span>
                                                </div>

                                                <div className='requirement-item'>
                                                    <i className={`bi bi-${passwordRequirements.hasSpecialChar ? 'check-circle-fill' : 'circle'}`}
                                                        style={{ color: passwordRequirements.hasSpecialChar ? '#4caf50' : '#ccc' }}></i>
                                                    <span>Special character (!@#$%...)</span>
                                                </div>

                                                <div className='requirement-item'>
                                                    <i className={`bi bi-${passwordRequirements.hasMatch ? 'check-circle-fill' : 'circle'}`}
                                                        style={{ color: passwordRequirements.hasMatch ? '#4caf50' : '#ccc' }}></i>
                                                    <span>Passwords match</span>
                                                </div>
                                            </div>
                                        )}
                                    </span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className='signup-input'
                                />
                                {/* Real-time password validation */}
                                {password.length > 0 && (
                                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                                        {!passwordRequirements.minLength && (
                                            <div style={{ color: '#dc3545', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <i className="bi bi-x-circle"></i>
                                                <span>At least 6 characters required</span>
                                            </div>
                                        )}
                                        {!passwordRequirements.hasUppercase && (
                                            <div style={{ color: '#dc3545', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <i className="bi bi-x-circle"></i>
                                                <span>Needs uppercase letter (A-Z)</span>
                                            </div>
                                        )}
                                        {!passwordRequirements.hasLowercase && (
                                            <div style={{ color: '#dc3545', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <i className="bi bi-x-circle"></i>
                                                <span>Needs lowercase letter (a-z)</span>
                                            </div>
                                        )}
                                        {!passwordRequirements.hasNumber && (
                                            <div style={{ color: '#dc3545', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <i className="bi bi-x-circle"></i>
                                                <span>Needs number (0-9)</span>
                                            </div>
                                        )}
                                        {!passwordRequirements.hasSpecialChar && (
                                            <div style={{ color: '#dc3545', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <i className="bi bi-x-circle"></i>
                                                <span>Needs special character</span>
                                            </div>
                                        )}
                                        {passwordRequirements.minLength && passwordRequirements.hasUppercase &&
                                            passwordRequirements.hasLowercase && passwordRequirements.hasNumber &&
                                            passwordRequirements.hasSpecialChar && (
                                                <div style={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <i className="bi bi-check-circle-fill"></i>
                                                    <span>Strong password ✓</span>
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Confirm Password (full width) */}
                        <div>
                            <div>
                                <label>
                                    Confirm Password:
                                    <span
                                        className='tooltip-container'
                                        onMouseEnter={() => setShowConfirmPasswordTooltip(true)}
                                        onMouseLeave={() => setShowConfirmPasswordTooltip(false)}
                                    >
                                        <span style={{ color: '#dc3545', fontSize: '18px', fontWeight: 'bold' }}>*</span>
                                        {showConfirmPasswordTooltip && (
                                            <div className='tooltip'>
                                                <div className='tooltip-arrow'></div>
                                                <strong style={{ display: 'block', marginBottom: '8px' }}>Confirm Password:</strong>

                                                {confirmPassword.length > 0 && (
                                                    <div className='requirement-item'>
                                                        <i className={`bi bi-${passwordRequirements.hasMatch ? 'check-circle-fill' : 'x-circle-fill'}`}
                                                            style={{ color: passwordRequirements.hasMatch ? '#4caf50' : '#dc3545' }}></i>
                                                        <span style={{ color: passwordRequirements.hasMatch ? '#4caf50' : '#dc3545' }}>
                                                            {passwordRequirements.hasMatch ? 'Passwords match ✓' : 'Passwords do not match ✗'}
                                                        </span>
                                                    </div>
                                                )}

                                                {confirmPassword.length === 0 && (
                                                    <span style={{ fontSize: '13px', color: '#ccc' }}>
                                                        Please re-enter your password to confirm
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    className='signup-input'
                                />
                                {/* Real-time confirm password validation */}
                                {confirmPassword.length > 0 && !passwordRequirements.hasMatch && (
                                    <div style={{
                                        color: '#dc3545',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <i className="bi bi-x-circle"></i>
                                        <span>Passwords do not match</span>
                                    </div>
                                )}
                                {confirmPassword.length > 0 && passwordRequirements.hasMatch && (
                                    <div style={{
                                        color: '#4caf50',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <i className="bi bi-check-circle-fill"></i>
                                        <span>Passwords match ✓</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className='signup-button'>
                            {loading ? 'Loading...' : 'Register'}
                        </button>
                    </form>
                    <p style={{ marginTop: '10px' }}>
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </div >
            </div>

            {/* Success Modal */}
            <Modal
                show={showSuccessModal}
                onHide={handleCloseSuccessModal}
                backdrop="static"
                keyboard={false}
                centered
                size="lg"
            >
                <Modal.Header
                    closeButton
                    style={{
                        backgroundColor: '#e7f3ff',
                        borderBottom: '2px solid #009cde',
                        padding: '20px'
                    }}
                >
                    <Modal.Title style={{
                        color: '#0066a1',
                        fontWeight: '600',
                        fontSize: '22px',
                        width: '100%',
                        textAlign: 'center'
                    }}>
                        <i className="bi bi-info-circle-fill" style={{ fontSize: '35px', marginRight: '12px' }}></i>
                        <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                            Registration Successful
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#fff'
                }}>
                    <div style={{
                        backgroundColor: '#f0fff4',
                        border: '2px solid #9ae6b4',
                        borderRadius: '10px',
                        padding: '30px',
                        marginBottom: '20px'
                    }}>
                        <i className="bi bi-person-check" style={{
                            fontSize: '55px',
                            color: '#38a169',
                            marginBottom: '20px',
                            display: 'block'
                        }}></i>
                        <h5 style={{
                            color: '#2d3748',
                            fontWeight: '600',
                            marginBottom: '20px',
                            fontSize: '18px'
                        }}>
                            Account Created Successfully
                        </h5>
                        <p style={{
                            fontSize: '16px',
                            color: '#555',
                            lineHeight: '1.8',
                            margin: '0'
                        }}>
                            Your account has been created successfully!
                        </p>
                    </div>

                    <div style={{
                        backgroundColor: '#fff3cd',
                        border: '2px solid #ffc107',
                        borderRadius: '10px',
                        padding: '20px',
                        marginTop: '20px',
                        textAlign: 'left'
                    }}>
                        <h6 style={{
                            color: '#856404',
                            fontWeight: '600',
                            marginBottom: '15px',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '24px' }}></i>
                            Important: Email Verification Required
                        </h6>
                        <ul style={{
                            fontSize: '14px',
                            color: '#856404',
                            lineHeight: '1.8',
                            marginBottom: '0',
                            paddingLeft: '20px'
                        }}>
                            <li>A confirmation email has been sent to <strong>{email}</strong></li>
                            <li>Please check your inbox and click the verification link</li>
                            <li>You must verify your email before you can log in</li>
                            <li>If you don't see the email, check your spam folder</li>
                        </ul>
                    </div>

                    <div style={{
                        fontSize: '14px',
                        color: '#6c757d',
                        marginTop: '20px'
                    }}>
                        <i className="bi bi-envelope"></i> Need help? Please contact our support team
                    </div>
                </Modal.Body>
                <Modal.Footer style={{
                    justifyContent: 'center',
                    padding: '20px',
                    backgroundColor: '#f8f9fa'
                }}>
                    <Button
                        onClick={handleCloseSuccessModal}
                        size="lg"
                        style={{
                            minWidth: '150px',
                            fontWeight: '600',
                            fontSize: '16px',
                            backgroundColor: '#009cde',
                            border: 'none',
                            color: 'white'
                        }}
                    >
                        <i className="bi bi-check-circle me-2"></i>
                        I Understand
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default Sign_up;
