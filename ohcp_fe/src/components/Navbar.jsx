import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Css/Navbar.css'; // Đảm bảo dùng đúng file CSS đã sửa

function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isAuthenticated, roles, logout } = useAuth();

    const isAdmin = roles.includes('admin');
    const isDoctor = roles.includes('doctor');
    const isUser = roles.includes('patient');

    return (
        <>
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
                        <Link to="/appointment" className="btn-appointment">
                            MAKE AN APPOINTMENT
                        </Link>
                    </div>
                </div>
            </div>

            {/* ============ MAIN NAVBAR ============ */}
            <nav className="main-navbar">
                <div className="container d-flex justify-content-between align-items-center position-relative">

                    {/* Desktop Menu */}
                    <ul className="nav-menu d-none d-lg-flex m-0">
                        <li><NavLink to="/" className="nav-link" end>Home</NavLink></li>
                        <li><NavLink to="/aboutus" className="nav-link" end>About Us</NavLink></li>
                        <li><NavLink to="/schedule" className="nav-link">Schedule</NavLink></li>
                        <li><NavLink to="/doctors" className="nav-link">Doctors</NavLink></li>
                        <li><NavLink to="/records" className="nav-link">Records</NavLink></li>
                        <li><NavLink to="/video" className="nav-link">Video Call</NavLink></li>
                        <li><NavLink to="/prescription" className="nav-link">Prescription</NavLink></li>
                        <li><NavLink to="/chat" className="nav-link">Chat</NavLink></li>
                        <li><NavLink to="/payment" className="nav-link">Payment</NavLink></li>
                        <li><NavLink to="/reminders" className="nav-link">Reminders</NavLink></li>
                        <li><NavLink to="/contactus" className="nav-link" end>Contact Us</NavLink></li>
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
                                <NavLink to="/register" className="btn-register">Register</NavLink>
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

                {/* Mobile Menu - Dùng đúng class CSS đã có */}
                {mobileMenuOpen && (
                    <div className="mobile-menu-container">
                        <ul className="mobile-menu">
                            <li><NavLink to="/" onClick={() => setMobileMenuOpen(false)} end>Home</NavLink></li>
                            <li><NavLink to="/schedule" onClick={() => setMobileMenuOpen(false)}>Schedule</NavLink></li>
                            <li><NavLink to="/doctors" onClick={() => setMobileMenuOpen(false)}>Doctors</NavLink></li>
                            <li><NavLink to="/records" onClick={() => setMobileMenuOpen(false)}>Records</NavLink></li>
                            <li><NavLink to="/video" onClick={() => setMobileMenuOpen(false)}>Video Call</NavLink></li>
                            <li><NavLink to="/prescription" onClick={() => setMobileMenuOpen(false)}>Prescription</NavLink></li>
                            <li><NavLink to="/chat" onClick={() => setMobileMenuOpen(false)}>Chat</NavLink></li>
                            <li><NavLink to="/payment" onClick={() => setMobileMenuOpen(false)}>Payment</NavLink></li>
                            <li><NavLink to="/reminders" onClick={() => setMobileMenuOpen(false)}>Reminders</NavLink></li>
                            {isAdmin && (
                                <li><NavLink to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin Panel</NavLink></li>
                            )}
                            <hr className="border-secondary my-3" />
                            {isAuthenticated ? (
                                <li>
                                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn-mobile-logout w-100 text-start">
                                        <i className="fas fa-sign-out-alt me-2"></i> Logout
                                    </button>
                                </li>
                            ) : (
                                <>
                                    <li><NavLink to="/login" onClick={() => setMobileMenuOpen(false)}>Login</NavLink></li>
                                    <li><NavLink to="/register" onClick={() => setMobileMenuOpen(false)}>Register</NavLink></li>
                                </>
                            )}
                        </ul>
                    </div>
                )}
            </nav>
        </>
    );
}

export default Navbar;