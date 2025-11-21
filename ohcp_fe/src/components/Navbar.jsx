import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Css/Navbar.css'; // Đảm bảo dùng đúng file CSS đã sửa

function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
    const { isAuthenticated, roles, logout } = useAuth();
    const navigate = useNavigate();

    const isAdmin = roles.includes('admin');
    const isDoctor = roles.includes('doctor');
    const isUser = roles.includes('patient');

    // Handle appointment button click with authentication and role check
    const handleAppointmentClick = (e) => {
        e.preventDefault();

        // Check if user is authenticated
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // Check role - only Patient can access schedule
        if (isUser) {
            navigate('/schedule');
        } else {
            // Doctor or Admin - redirect to home
            navigate('/');
        }
    };

    return (
        <>
            <div style={{paddingTop:"2%"}}>
                {/* ============ TOP BAR ============ */}
                <div className="topbar">
                    <div className="container d-flex justify-content-between align-items-center flex-wrap">
                        <div className="logo d-flex align-items-center">
                            <NavLink to="/" className="nav-link" end>
                                <img src="/logo_footer.png" alt="Logo" className="logo-img" />
                            </NavLink>
                        </div>

                        <div className="topbar-right d-flex align-items-center flex-wrap justify-content-center">
                            <div >
                                <img src="/Call.png" alt="" className="logo-Call" />
                            </div>
                            <div className="contact-info text-center text-md-end" style={{ paddingRight: "20px" }}>
                                <p>
                                    <i className="fas fa-phone-alt"></i>{' '}
                                    <a href="tel:+00201748812598" className="text-black text-decoration-none hover-underline">
                                        Phone : +(002) 0174-8812-598
                                    </a>
                                </p>

                                <p>
                                    <i className="fas fa-envelope"></i>{' '}
                                    <a href="mailto:support@healthportal.com" className="text-black text-decoration-none hover-underline">
                                        Email : support@healthportal.com
                                    </a>
                                </p>
                            </div>
                            <button onClick={handleAppointmentClick} className="btn-appointment" style={{ border: "none" }}>
                                MAKE AN APPOINTMENT
                            </button>
                        </div>
                    </div>
                </div>

                {/* ============ MAIN NAVBAR ============ */}
                <nav className="main-navbar">
                    <div className="container d-flex justify-content-between align-items-center position-relative">

                        {/* Desktop Menu */}
                        <ul className="nav-menu d-none d-lg-flex m-0">
                            <li><NavLink to="/" className="nav-link" end>Home</NavLink></li>
                            <li><NavLink to="/about_us" className="nav-link" end>About Us</NavLink></li>
                            <li><NavLink to="/doctors" className="nav-link">Doctors</NavLink></li>
                            <li><a href="#" onClick={handleAppointmentClick} className="nav-link">Schedule</a></li>
                            <li><NavLink to="/contact_us" className="nav-link" end>Contact Us</NavLink></li>
                            {isAdmin && (
                                <li><NavLink to="/admin" className="nav-link">Admin Panel</NavLink></li>
                            )}
                        </ul>

                        {/* Right Side: Auth Buttons */}
                        <div className="nav-right d-flex align-items-center gap-3">
                            {isAuthenticated ? (
                                <>
                                    <span className="user-role text-white fw-medium">
                                        {isAdmin ? 'Admin' : isDoctor ? 'Doctor' : 'Patient'}
                                    </span>
                                    <button onClick={logout} className="btn-logout">
                                        <i className="fas fa-sign-out-alt me-1"></i> Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <NavLink to="/login" className="btn-login">Login</NavLink>
                                </>
                            )}

                            {/* Social Icons */}
                            <div className="nav-icons d-none d-xl-flex gap-3 ms-3">
                                <a href="#" className="text-white"><i className="fab fa-facebook-f"></i></a>
                                <a href="#" className="text-white"><i className="fab fa-linkedin-in"></i></a>
                                <a href="#" className="text-white"><i className="fab fa-twitter"></i></a>
                            </div>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="mobile-toggle d-lg-none"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="mobile-menu-container">
                            <ul className="mobile-menu">
                                <li>
                                    <NavLink to="/" onClick={() => setMobileMenuOpen(false)} end className="mobile-nav-link">
                                        <i className="fas fa-home me-2"></i> Home
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/about_us" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">
                                        <i className="fas fa-info-circle me-2"></i> About Us
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/doctors" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">
                                        <i className="fas fa-user-md me-2"></i> Doctors
                                    </NavLink>
                                </li>
                                <li>
                                    <a href="#" onClick={(e) => { handleAppointmentClick(e); setMobileMenuOpen(false); }} className="mobile-nav-link">
                                        <i className="fas fa-calendar-alt me-2"></i> Schedule
                                    </a>
                                </li>
                                <li>
                                    <NavLink to="/contact_us" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">
                                        <i className="fas fa-envelope me-2"></i> Contact Us
                                    </NavLink>
                                </li>
                                {isAdmin && (
                                    <li>
                                        <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link admin-link">
                                            <i className="fas fa-cog me-2"></i> Admin Panel
                                        </NavLink>
                                    </li>
                                )}

                                <hr className="mobile-divider" />

                                {/* Auth Section */}
                                <div className="mobile-auth-section">
                                    {isAuthenticated ? (
                                        <>
                                            <div className="mobile-user-info">
                                                <i className="fas fa-user-circle me-2"></i>
                                                <span className="mobile-role-badge">
                                                    {isAdmin ? 'Admin' : isDoctor ? 'Doctor' : 'Patient'}
                                                </span>
                                            </div>
                                            <li>
                                                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn-mobile-logout">
                                                    <i className="fas fa-sign-out-alt me-2"></i> Logout
                                                </button>
                                            </li>
                                        </>
                                    ) : (
                                        <li>
                                            <NavLink to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-mobile-login">
                                                <i className="fas fa-sign-in-alt me-2"></i> Login
                                            </NavLink>
                                        </li>
                                    )}
                                </div>

                                {/* Social Icons */}
                                <div className="mobile-social-icons">
                                    <a href="#" className="mobile-social-link"><i className="fab fa-facebook-f"></i></a>
                                    <a href="#" className="mobile-social-link"><i className="fab fa-linkedin-in"></i></a>
                                    <a href="#" className="mobile-social-link"><i className="fab fa-twitter"></i></a>
                                </div>
                            </ul>
                        </div>
                    )}
                </nav>
            </div>
        </>
    );
}

export default Navbar;