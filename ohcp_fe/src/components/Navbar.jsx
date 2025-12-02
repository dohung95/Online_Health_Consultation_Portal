import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Css/Navbar.css'; // Đảm bảo dùng đúng file CSS đã sửa

function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { isAuthenticated, roles, logout } = useAuth();
    const navigate = useNavigate();
    const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
    const isAdmin = roles.some(role => role.toLowerCase() === 'admin');
    const isDoctor = roles.some(role => role.toLowerCase() === 'doctor');
    const isUser = roles.some(role => role.toLowerCase() === 'patient');

    // Handle scroll to show/hide navbar
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < 10) {
                // Always show navbar at top
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY) {
                // Scrolling down - hide navbar
                setIsVisible(false);
            } else {
                // Scrolling up - show navbar
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    // Handle appointment button click with authentication and role check
    // const handleAppointmentClick = (e) => {
    //     e.preventDefault();

    //     // Check role - only Patient can access schedule
    //     if (isAuthenticated && !isUser) {
    //         // Doctor or Admin - show alert
    //         alert("Schedule appointments is only available for patients.");
    //         return;
    //     }

    //     // Use handleAuthenticatedAction để hiển thị confirm dialog
    //     handleAuthenticatedAction(isAuthenticated, navigate, '/schedule');
    // };

    return (
        <>
            <div className={`navbar-wrapper container ${isVisible ? 'navbar-visible' : 'navbar-hidden'}`}>
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
                            <NavLink to="/schedule" className="nav-link">
                                <button className="btn-appointment" style={{ border: "none" }}>
                                    MAKE AN APPOINTMENT
                                </button>
                            </NavLink>

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
                            <li><NavLink to="/schedule" className="nav-link">Schedule</NavLink></li>
                            <li><NavLink to="/contact_us" className="nav-link" end>Contact Us</NavLink></li>
                        </ul>

                        {/* Right Side: Auth Buttons */}
                        <div className="nav-right d-flex align-items-center gap-3">
                            {isAuthenticated ? (
                                <>
                                    {/* Notification Bell - Only for authenticated users */}
                                    {isUser && <NotificationBell />}

                                    {/* Patient Dropdown */}
                                    {isUser && (
                                        <div
                                            className="position-relative"
                                            onMouseEnter={() => setPatientDropdownOpen(true)}
                                            onMouseLeave={() => setPatientDropdownOpen(false)}
                                        >
                                            <span className="user-role text-white fw-medium" style={{ cursor: 'pointer' }}>
                                                Patient <i className="fas fa-caret-down ms-1"></i>
                                            </span>
                                            {patientDropdownOpen && (
                                                <div className="dropdown-menu show position-absolute" style={{ top: '100%', right: 0, minWidth: '200px' }}>
                                                    <NavLink to="/profile-patient" className="dropdown-item">
                                                        <i className="fas fa-user me-2"></i>
                                                        My Profile
                                                    </NavLink>
                                                    <NavLink to="/my-appointments" className="dropdown-item">
                                                        <i className="fas fa-calendar-check me-2"></i>
                                                        My Appointments
                                                    </NavLink>
                                                    <NavLink to="/my-prescriptions" className="dropdown-item">
                                                        <i className="fas fa-prescription-bottle-alt me-2"></i>
                                                        My Prescriptions
                                                    </NavLink>
                                                    <NavLink to="/health-records" className="dropdown-item">
                                                        <i className="fas fa-file-medical me-2"></i>
                                                        Health Records
                                                    </NavLink>
                                                    <NavLink to="/share-records" className="dropdown-item">
                                                        <i className="fas fa-share-alt me-2"></i>
                                                        Share Health Records
                                                    </NavLink>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Admin/Doctor - No Dropdown */}
                                    {(isAdmin || isDoctor) && (
                                        <span className="user-role text-white fw-medium">
                                            {isAdmin ? 'Admin' : 'Doctor'}
                                        </span>
                                    )}

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
                                    <NavLink to="/schedule" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">
                                        <i className="fas fa-calendar-alt me-2"></i> Schedule
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/contact_us" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">
                                        <i className="fas fa-envelope me-2"></i> Contact Us
                                    </NavLink>
                                </li>

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