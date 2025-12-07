import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorService } from '../api/doctorApi';
import { notificationApi } from '../api/notificationApi';
import signalRService from '../services/signalrService';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../components/Css/DoctorPage.css';
import DoctorProfileView from './DoctorProfileView';
import DoctorAppointmentsView from './DoctorAppointmentsView';
import DoctorReviewView from './DoctorReviewView';
import DoctorAppointmentDetail from './DoctorAppointmentDetail';
import SharedRecordsView from './SharedRecordsView';

const DoctorProfile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state: 'profile' | 'appointments' | 'reviews' | 'appointmentDetail'
  const [view, setView] = useState('profile');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // New appointment notification state
  const [newAppointmentCount, setNewAppointmentCount] = useState(0);
  const [viewedAppointments, setViewedAppointments] = useState(() => {
    const saved = localStorage.getItem('viewedAppointments');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Notification dropdown state
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  useEffect(() => {
    fetchDoctorData();
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Connect to SignalR
    const initSignalR = async () => {
      console.log('🔄 Initializing SignalR connection...');
      
      // Define the handler for new appointments
      const handleNewAppointment = (appointment) => {
        console.log('📅 New appointment received:', appointment);
        // Increment counter only if not already viewed
        const viewed = JSON.parse(localStorage.getItem('viewedAppointments') || '[]');
        if (!viewed.includes(appointment.appointmentID)) {
          setNewAppointmentCount(prev => prev + 1);
        }
        // Refresh notifications
        fetchNotifications();
      };
      
      // Register listener BEFORE starting connection
      console.log('📢 Registering listener for ReceiveAppointmentNotification...');
      signalRService.on('ReceiveAppointmentNotification', handleNewAppointment);
      
      // Now start the connection - it will auto-register the listener
      await signalRService.startConnection();
      console.log('✅ SignalR initialization complete');
    };
    
    initSignalR();
    
    return () => {
      signalRService.off('ReceiveAppointmentNotification');
    };
  }, []);
  
  // Handle click outside notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getCurrentDoctor();
      setDoctorData(data);
    } catch (err) {
      console.error('Error fetching doctor data:', err);
      setError('Failed to load doctor information');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getMyNotifications();
      console.log('Fetched notifications:', data);
      setNotifications(data || []);
      const unread = data?.filter(n => !n.isRead).length || 0;
      setUnreadCount(unread);
      console.log('Unread count:', unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleLogout = async () => {
    try {
      // Stop SignalR connection before logout
      await signalRService.stopConnection();
      
      // Clear tokens from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Call logout from AuthContext (clears state and Firebase)
      await logout();
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigate to login even if logout fails
      navigate('/login');
    }
  };

  const handleViewAppointment = async (appointment) => {
    try {
      setLoading(true);
      
      // Mark appointment as viewed
      if (!viewedAppointments.includes(appointment.appointmentID)) {
        const updatedViewed = [...viewedAppointments, appointment.appointmentID];
        setViewedAppointments(updatedViewed);
        localStorage.setItem('viewedAppointments', JSON.stringify(updatedViewed));
        setNewAppointmentCount(prev => Math.max(0, prev - 1));
      }
      
      // Try different possible field names for patient ID
      const patientId = appointment.patient?.patientID;
      
      if (!patientId) {
        throw new Error('Patient ID not found in appointment object');
      }
      
      const patientData = await doctorService.getPatientById(patientId);
      setSelectedAppointment(appointment);
      setSelectedPatient(patientData);
      setView('appointmentDetail');
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToAppointments = () => {
    setView('appointments');
    setSelectedAppointment(null);
    setSelectedPatient(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  
  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <aside className="sidebar d-flex flex-column">
        <div className="d-flex flex-column gap-4">
          {/* Doctor Profile Summary */}
          <div className="d-flex gap-3 align-items-center">
            <div className="doctor-profile-img"></div>
            <div className="d-flex flex-column">
              <h1 className="fs-6 fw-bold mb-0 text-dark">
                {doctorData?.fullName || 'Loading...'}
              </h1>
              <p className="text-secondary small mb-0">{doctorData?.specialty || 'Specialty'}</p>
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="status-badge">
              <span className="status-dot"></span>
              Working
            </span>
            
            {/* Notification Bell */}
            <div className="position-relative" ref={notificationRef}>
              <button
                className="btn btn-link p-0 position-relative"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              >
                <span className={`material-symbols-outlined fs-4 text-dark ${unreadCount > 0 ? 'notification-bell-pulse' : ''}`}>
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <div className="notification-dropdown position-absolute mt-2 shadow-lg" style={{ zIndex: 1050, width: '70%', right: 0, left: 'auto' }}>
                  <div className="bg-white rounded-3 overflow-hidden">
                    <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                      <h6 className="mb-0 fw-bold">Notifications</h6>
                      {unreadCount > 0 && (
                        <button
                          className="btn btn-link btn-sm p-0 text-primary"
                          onClick={async () => {
                            await notificationApi.markAllAsRead();
                            fetchNotifications();
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                          <span className="material-symbols-outlined fs-1">notifications_off</span>
                          <p className="mb-0 mt-2">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.notificationId}
                            className={`notification-item p-3 border-bottom ${!notif.isRead ? 'bg-light notification-new-pulse' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={async () => {
                              // Mark as read
                              if (!notif.isRead) {
                                await notificationApi.markAsRead(notif.notificationId);
                                fetchNotifications();
                              }
                              
                              // Navigate to appointment detail if appointmentId exists
                              if (notif.appointmentId && doctorData) {
                                try {
                                  setLoading(true);
                                  setShowNotificationDropdown(false);
                                  
                                  // Fetch the appointment details using doctor's ID
                                  const appointments = await doctorService.getDoctorAppointments(doctorData.doctorID);
                                  const appointment = appointments.find(apt => apt.appointmentID === notif.appointmentId);
                                  
                                  if (appointment) {
                                    await handleViewAppointment(appointment);
                                  }
                                } catch (err) {
                                  console.error('Error navigating to appointment:', err);
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                          >
                            <div className="d-flex gap-2">
                              <span className="material-symbols-outlined text-primary">
                                calendar_month
                              </span>
                              <div className="flex-grow-1">
                                <p className="mb-1 small" style={{ whiteSpace: 'pre-line' }}>
                                  {notif.message}
                                </p>
                                <small className="text-muted">
                                  {new Date(notif.createdAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </small>
                              </div>
                              {!notif.isRead && (
                                <span className="badge bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="d-flex flex-column gap-2 pt-4">
            <a 
              className={`nav-link-custom ${view === 'profile' ? 'nav-link-active' : ''}`} 
              href="#" 
              onClick={(e) => { e.preventDefault(); setView('profile'); }}
            >
              <span className="material-symbols-outlined">person</span>
              <p className="mb-0 small fw-bold">Profile</p>
            </a>
            <a 
              className={`nav-link-custom ${view === 'appointments' || view === 'appointmentDetail' ? 'nav-link-active' : ''}`} 
              href="#" 
              onClick={(e) => { e.preventDefault(); setView('appointments'); }}
            >
              <span className="material-symbols-outlined">calendar_month</span>
              <p className="mb-0 small">Appointments</p>
              {newAppointmentCount > 0 && (
                <span className="badge bg-danger rounded-pill ms-auto">{newAppointmentCount}</span>
              )}
            </a>
            <a 
              className={`nav-link-custom ${view === 'reviews' ? 'nav-link-active' : ''}`} 
              href="#" 
              onClick={(e) => { e.preventDefault(); setView('reviews'); }}
            >
              <span className="material-symbols-outlined">star</span>
              <p className="mb-0 small fw-bold">Reviews</p>
            </a>
            <a 
              className={`nav-link-custom ${view === 'sharedRecords' ? 'nav-link-active' : ''}`} 
              href="#" 
              onClick={(e) => { e.preventDefault(); setView('sharedRecords'); }}
            >
              <span className="material-symbols-outlined">folder_shared</span>
              <p className="mb-0 small">Shared Records</p>
            </a>
          </div>
        </div>
        
        {/* Bottom Links */}
        <div className="d-flex flex-column gap-4 mt-auto">
          <div className="d-flex flex-column gap-1">
            <a className="nav-link-custom logout-link" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              <span className="material-symbols-outlined">logout</span>
              <p className="mb-0 small">Logout</p>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow-1 p-5">
        <div className="container-fluid p-0">
          <div className="mx-auto" style={{ maxWidth: (view === 'appointments' || view === 'appointmentDetail') ? '1280px' : '960px' }}> {/* max-w-7xl for appointments, max-w-4xl for others */}
            {/* Page Heading */}
            <div className="mb-4">
              <div>
                <h2 className="fs-3 fw-bold mb-1 text-dark">
                  {view === 'profile' ? 'Doctor Profile' : view === 'appointments' ? 'Appointments' : view === 'sharedRecords' ? 'Shared Health Records' : view === 'appointmentDetail' ? 'Appointment Details' : 'Reviews'}
                </h2>
                <p className="text-secondary mb-0">
                  {view === 'profile' ? 'Manage your personal information.' : 
                   view === 'appointments' ? 'List of your appointments with patients.' :
                    view === 'sharedRecords' ? 'Health records shared with you by patients.' :
                   view === 'appointmentDetail' ? 'Detailed information about the selected appointment.' : 
                   'Patient reviews and ratings.'}
                </p>
              </div>
            </div>

            {/* Main Card/Content Area */}
            <div className="bg-custom-white info-card">
              {view === 'profile' && <DoctorProfileView doctorData={doctorData} />}
              {view === 'appointments' && (
                <DoctorAppointmentsView 
                  doctorId={doctorData?.doctorID} 
                  onViewAppointment={handleViewAppointment}
                  viewedAppointments={viewedAppointments}
                />
              )}
              {view === 'reviews' && <DoctorReviewView doctorId={doctorData?.doctorID} />}
              {view === 'sharedRecords' && <SharedRecordsView />}
              {view === 'appointmentDetail' && (
                <DoctorAppointmentDetail 
                  appointment={selectedAppointment}
                  patient={selectedPatient}
                  onBack={handleBackToAppointments}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorProfile;