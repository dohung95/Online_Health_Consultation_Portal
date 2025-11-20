import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Navbar';
import Loading from '../Loading';

export function Sign_in() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const containerStyle = {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '4px'
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
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(email, password);
            if (success) {
                navigate('/');
            } else {
                setError('Invalid email or password');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className='Background_Sign_in'>
                <div className='container'>
                    <Navbar />
                </div>
                <div style={containerStyle}>
                    <h2>Login</h2>
                    {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
                    <form onSubmit={handleSubmit}>
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
        </>

    );
}

export default Sign_in;
