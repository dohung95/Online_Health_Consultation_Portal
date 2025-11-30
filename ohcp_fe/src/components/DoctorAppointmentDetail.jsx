import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../components/Css/DoctorPage.css';
import CreatePrescriptionModal from './CreatePrescriptionModal';

const DoctorAppointmentDetail = ({ appointment, patient, onBack }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to calculate age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!appointment || !patient) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header (Toolbar & Breadcrumbs) */}
      <header className="d-flex align-items-center justify-content-center border-bottom border-border-light bg-content-light" style={{ height: '4rem' }}>
        <div className="d-flex w-100" style={{ maxWidth: '1280px', paddingLeft: '1rem', paddingRight: '1rem' }}>
          {/* Breadcrumbs */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button 
              className="p-2 text-text-light-secondary border-0 bg-transparent"
              onClick={() => onBack ? onBack() : navigate('/doctor-page')}
              style={{ cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <a className="text-text-light-secondary small fw-medium text-decoration-none" href="#" onClick={(e) => { e.preventDefault(); onBack ? onBack() : navigate('/doctor-page'); }}>
              Appointments List
            </a>
            <span className="text-text-light-secondary small fw-medium">/</span>
            <span className="text-text-light-primary small fw-medium">Appointment Details</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 d-flex justify-content-center p-4 p-md-5">
        <div className="w-100" style={{ maxWidth: '1280px' }}>
          <div className="row g-4">
            {/* Main Column */}
            <div className="col-12 d-flex flex-column gap-4">
              
              {/* ProfileHeader */}
              <div className="rounded-3 border border-border-light bg-content-light shadow-sm">
                <div className="p-4 p-md-4">
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-4">
                    <div className="d-flex align-items-center gap-4">
                      <div className="profile-avatar"></div>
                      <div className="d-flex flex-column justify-content-center">
                        <p className="text-text-light-primary fs-5 fw-bold mb-0">{patient.fullName || 'N/A'}</p>
                        <p className="text-text-light-secondary small mb-1">
                          {calculateAge(patient.dateOfBirth)} years old
                        </p>
                        <p className="text-text-light-secondary small mb-0">
                          {patient.user?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>

              {/* Appointment Details & Actions */}
              <div className="rounded-3 border border-border-light bg-content-light shadow-sm">
                <div className="border-bottom border-border-light p-4 p-md-4">
                  <h2 className="fs-5 fw-bold text-text-light-primary mb-0">Appointment Details</h2>
                </div>
                {/* DescriptionList */}
                <div className="p-4 p-md-4 row g-0 text-sm">
                  <div className="col-5 col-md-3 mb-3 text-text-light-secondary">Date and Time</div>
                  <div className="col-7 col-md-9 mb-3 text-text-light-primary fw-medium">
                    {formatTime(appointment.appointmentTime)} - {formatDate(appointment.appointmentTime)}
                  </div>
                <div className="col-5 col-md-3 mb-3 text-text-light-secondary">Type</div>
                <div className="col-7 col-md-9 mb-3 text-text-light-primary fw-medium">
                    {appointment.consultationType || 'N/A'}
                </div>

                  <div className="col-5 col-md-3 mb-3 text-text-light-secondary">Status</div>
                  <div className="col-7 col-md-9 mb-3 d-flex align-items-center gap-2">
                    <div className={`rounded-circle ${
                      appointment.status === 'Scheduled' ? 'bg-warning' :
                      appointment.status === 'Completed' ? 'bg-success' :
                      appointment.status === 'Cancelled' ? 'bg-danger' :
                      'bg-secondary'
                    }`} style={{ height: '0.625rem', width: '0.625rem' }}></div>
                    <p className="text-text-light-primary fw-medium mb-0">{appointment.status || 'N/A'}</p>
                  </div>

                  <div className="col-5 col-md-3 text-text-light-secondary">Reason for Visit</div>
                  <div className="col-7 col-md-9 text-text-light-primary fw-medium">
                    {appointment.reason || 'No reason provided'}
                  </div>
                </div>
                {/* ButtonGroup */}
                <div className="d-flex flex-column flex-md-row gap-3 p-4 pt-0 p-md-4 pt-md-2">
                  <button className="btn btn-primary h-auto py-3 fw-bold flex-fill">
                    Join Appointment
                  </button>
                  <button 
                    className="btn btn-secondary-custom h-auto py-3 fw-bold flex-fill"
                    onClick={() => setIsPrescriptionModalOpen(true)}
                  >
                    Prescribe Medication
                  </button>
                  
                </div>
              </div>
            </div>

            {/* Full Width Tab Section (col-12) */}
            <div className="col-12">
              <div className="rounded-3 border border-border-light bg-content-light shadow-sm">
                <div className="border-bottom border-border-light">
                  <ul className="nav nav-tabs border-0 px-4 px-md-4" role="tablist">
                    <li className="nav-item" role="presentation">
                      <a className="nav-link active" data-bs-toggle="tab" href="#records" role="tab" aria-selected="true">Medical Records</a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="tab" href="#prescriptions" role="tab" aria-selected="false">Previous Prescriptions</a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="tab" href="#tests" role="tab" aria-selected="false">Test Results</a>
                    </li>
                  </ul>
                </div>
                <div className="p-4 p-md-4">
                  <div className="tab-content">
                    <div className="tab-pane fade show active" id="records" role="tabpanel">
                      <div className="d-flex align-items-center justify-content-center rounded-3 border border-dashed border-border-light" style={{ height: '12rem' }}>
                        <p className="text-text-light-secondary mb-0">Medical records content will be displayed here.</p>
                      </div>
                    </div>
                    <div className="tab-pane fade" id="prescriptions" role="tabpanel">
                      <div className="d-flex align-items-center justify-content-center rounded-3 border border-dashed border-border-light" style={{ height: '12rem' }}>
                        <p className="text-text-light-secondary mb-0">Previous prescriptions will be displayed here.</p>
                      </div>
                    </div>
                    <div className="tab-pane fade" id="tests" role="tabpanel">
                      <div className="d-flex align-items-center justify-content-center rounded-3 border border-dashed border-border-light" style={{ height: '12rem' }}>
                        <p className="text-text-light-secondary mb-0">Test results will be displayed here.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Prescription Modal */}
      <CreatePrescriptionModal 
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        appointment={appointment}
        patient={patient}
      />
    </div>
  );
};

export default DoctorAppointmentDetail;
