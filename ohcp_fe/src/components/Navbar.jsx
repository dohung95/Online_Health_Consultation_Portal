// src/components/Navbar.js
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { isAuthenticated, roles, logout } = useAuth();
    const isAdmin = roles.includes('admin');
    const isDoctor = roles.includes('doctor');
    const isUser = roles.includes('patient');

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">Health Portal</Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/" exact>
                                Home
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/schedule">
                                Schedule
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/doctors">
                                Doctors
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/records">
                                Records
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/video">
                                Video
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/prescription">
                                Prescription
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/chat">
                                Chat
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/payment">
                                Payment
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/reminders">
                                Reminders
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/admin">
                                Admin
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/dashboard">
                                Dashboard
                            </NavLink>
                        </li>
                        {isAuthenticated ? (
                            <>
                                <li className="nav-item">
                                    {isUser && <p>User</p>}
                                    {isAdmin && <p>Admin</p>}
                                    {isDoctor && <p>Doctor</p>}
                                </li>
                                <li>
                                    <button className="nav-link" onClick={logout}>
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <NavLink className="nav-link" to="/login">
                                        Login
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink className="nav-link" to="/register">
                                        Register
                                    </NavLink>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;