import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorService } from '../api/doctorApi';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../components/Css/DoctorPage.css';
import DoctorProfileView from './DoctorProfileView';
import DoctorAppointmentsView from './DoctorAppointmentsView';
import ReviewsView from './ReviewsView';
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

  useEffect(() => {
    fetchDoctorData();
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewAppointment = async (appointment) => {
    try {
      setLoading(true);
      
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
                BS. {doctorData?.fullName || 'Loading...'}
              </h1>
              <p className="text-secondary small mb-0">{doctorData?.specialty || 'Specialty'}</p>
            </div>
          </div>
          <div className="d-flex">
            <span className="status-badge">
              <span className="status-dot"></span>
              Working
            </span>
          </div>
          
          {/* Navigation Links */}
          <div className="d-flex flex-column gap-2 pt-4">
            <a 
              className={`nav-link-custom ${view === 'profile' ? 'nav-link-active' : ''}`} 
              href="#" 
              onClick={(e) => { e.preventDefault(); setView('profile'); }}
            >
              <p className="mb-0">Profile</p>
            </a>
            <a 
              className={`nav-link-custom ${view === 'appointments' || view === 'appointmentDetail' ? 'nav-link-active' : ''}`} 
              href="#" 
              onClick={(e) => { e.preventDefault(); setView('appointments'); }}
            >
              <p className="mb-0">Appointments</p>

            </a>
            <a 
              className={`nav-link-custom ${view === 'reviews' ? 'nav-link-active' : ''}`} 
              href="#" 
              onClick={(e) => { e.preventDefault(); setView('reviews'); }}
            >
              <p className="mb-0">Reviews</p>

            </a>
          </div>
        </div>
        
        {/* Bottom Links */}
        <div className="d-flex flex-column gap-4 mt-auto">
          <div className="d-flex flex-column gap-1">
            <a className="nav-link-custom" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              <span className="material-symbols-outlined">logout</span>
              
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

            {/* Main Card/Content Area */}
            <div className="bg-custom-white info-card">
              {view === 'profile' && <DoctorProfileView doctorData={doctorData} />}
              {view === 'appointments' && (
                <DoctorAppointmentsView 
                  doctorId={doctorData?.doctorID} 
                  onViewAppointment={handleViewAppointment}
                />
              )}
              {view === 'reviews' && <ReviewsView doctorId={doctorData?.doctorID} />}
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