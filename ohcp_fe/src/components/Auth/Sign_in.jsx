import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { decodeToken } from '../../utils/tokenUtils';
import { Modal, Button } from 'react-bootstrap';
import '../Css/Sign_in.css';
export function Sign_in() {
    const navigate = useNavigate();
    const { login, token, roles } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');

    const containerStyle = {
        maxWidth: '400px',
        padding: '20px',
        border: '1px solid #000000ff',
        borderRadius: '4px',
        backgroundColor: '#eeeeee',
    };

    const inputStyle = {
        width: '100%',
        padding: '8px',
        margin: '10px 0',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxSizing: 'border-box'
    };

    const buttonStyle = {
        width: '100%',
        padding: '10px',
        backgroundColor: '#009cde',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px'
    };

    const handleCloseErrorModal = () => {
        setShowErrorModal(false);
        setErrorModalMessage('');
        // Không navigate ngay, chỉ đóng modal
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(email, password);
            if (success) {
                // Get token and decode to extract roles
                const token = localStorage.getItem('token');
                const decoded = decodeToken(token);

                // Extract roles from token
                let userRoles = [];
                const roleClaimType = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
                if (decoded?.[roleClaimType]) {
                    const roleValue = decoded[roleClaimType];
                    userRoles = Array.isArray(roleValue) ? roleValue : [roleValue];
                } else if (decoded?.role) {
                    const roleValue = decoded.role;
                    userRoles = Array.isArray(roleValue) ? roleValue : [roleValue];
                }

                // Navigate based on role (priority: Admin > Doctor > Patient)
                if (userRoles.some(r => r.toLowerCase() === 'admin')) {
                    navigate('/admin');
                } else if (userRoles.some(r => r.toLowerCase() === 'doctor')) {
                    navigate('/doctor-page');
                } else {
                    navigate('/');
                }
            } else {
                setError('Invalid email or password');
            }
        } catch (err) {
            const errorMessage = err.message || 'Login failed';

            // Check if error is related to account status or email confirmation
            const statusErrors = [
                'inactive',
                'suspended',
                'banned',
                'not active',
                'admin approval',
                'contact support',
                'confirm your email',
                'email address before logging in'
            ];

            const isStatusError = statusErrors.some(keyword =>
                errorMessage.toLowerCase().includes(keyword)
            );

            if (isStatusError) {
                // Show modal for status errors and email confirmation - DO NOT navigate here
                setErrorModalMessage(errorMessage);
                setShowErrorModal(true);
            } else {
                // Show inline error for other errors
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Redirect if already logged in with valid token
    useEffect(() => {
        if (token && roles && roles.length > 0) {
            // User is already logged in, redirect to appropriate page
            console.log('User already logged in, redirecting...');

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

    return (
        <>
            <div className='Background_Sign_In '>
                <div style={containerStyle} className='container' >
                    <h2>Login</h2>
                    {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
                    <form onSubmit={handleSubmit} >
                        <div>
                            <label>Email:</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label>Password:</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                style={inputStyle}
                            />
                        </div>
                        <button type="submit" disabled={loading} style={buttonStyle}>
                            {loading ? 'Loading...' : 'Login'}
                        </button>
                    </form>
                    <p style={{ marginTop: '10px' }}>
                        Don't have an account? <Link to="/register">Register</Link>
                    </p>
                </div>
            </div>

            {/* Error Modal */}
            <Modal
                show={showErrorModal}
                onHide={handleCloseErrorModal}
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
                            Account Access Notice
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#fff'
                }}>
                    <div style={{
                        backgroundColor: '#f0f8ff',
                        border: '2px solid #b3d9f2',
                        borderRadius: '10px',
                        padding: '30px',
                        marginBottom: '20px'
                    }}>
                        <i className="bi bi-person-lock" style={{
                            fontSize: '55px',
                            color: '#009cde',
                            marginBottom: '20px',
                            display: 'block'
                        }}></i>
                        <h5 style={{
                            color: '#0066a1',
                            fontWeight: '600',
                            marginBottom: '20px',
                            fontSize: '18px'
                        }}>
                            Unable to Access Your Account
                        </h5>
                        <p style={{
                            fontSize: '16px',
                            color: '#555',
                            lineHeight: '1.8',
                            margin: '0'
                        }}>
                            {errorModalMessage}
                        </p>
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: '#6c757d',
                        marginTop: '15px'
                    }}>
                        <i className="bi bi-envelope"></i> Please contact our support team if you need assistance
                    </div>
                </Modal.Body>
                <Modal.Footer style={{
                    justifyContent: 'center',
                    padding: '20px',
                    backgroundColor: '#f8f9fa'
                }}>
                    <Button
                        onClick={handleCloseErrorModal}
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

export default Sign_in;
