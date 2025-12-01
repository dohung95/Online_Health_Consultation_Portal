import React, { useState, useEffect } from 'react';
import { appointmentService } from '../api/appointmentApi';
import { doctorService } from '../api/doctorApi';
import { useNavigate, useParams } from 'react-router-dom';
import './Css/Schedule.css';
import Loading from './Loading';
import { useAuth } from '../context/AuthContext';

function Schedule() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('Video Call');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { doctorId } = useParams();
  const { isAuthenticated } = useAuth();
  // 1. Load list of Doctors
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const data = await doctorService.getAllDoctors();
        setDoctors(data);
      } catch (error) {
        console.error("Failed to load doctors", error);
      }
    }
    fetchDoctors();
  }, []);
  // ✅ NEW: Auto-select specialty if coming from doctor detail page
  useEffect(() => {
    if (doctorId && doctors.length > 0) {
      const preSelectedDoc = doctors.find(d => d.doctorID === doctorId);
      if (preSelectedDoc) {
        setSelectedSpecialty(preSelectedDoc.specialty);
        setSelectedDoctor(doctorId);
      }
    }
  }, [doctorId, doctors]);
  // 2. Load empty Slot list when changing Doctor or Date
  useEffect(() => {
    if (!selectedDoctor || !date) return;
    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        const data = await appointmentService.getAvailableSlots(selectedDoctor, date);
        setSlots(data);
        setSelectedSlot(null);
      } catch (error) {
        console.error("Failed to load slots", error);
      }
      setLoadingSlots(false);
    }
    fetchSlots();
  }, [selectedDoctor, date]);
  // 3. appointment processing
  const handleSchedule = async () => {
    if (!selectedDoctor || !selectedSlot) {
      alert("Please select a doctor and a time slot.");
      return;
    }
    try {
      const bookingData = {
        doctorID: selectedDoctor,
        appointmentTime: selectedSlot.startTime,
        consultationType: consultationType
      };
      await appointmentService.createAppointment(bookingData);
      alert("Appointment scheduled successfully!");
      navigate('/my-appointments');
    } catch (error) {
      alert(error.response?.data?.message || "Failed to schedule appointment.");
    }
  };
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Helper functions
  const getSpecialties = () => {
    const specialties = [...new Set(doctors.map(doc => doc.specialty))];
    return specialties.filter(s => s).sort();
  };

  const getFilteredDoctors = () => {
    if (!selectedSpecialty) return [];

    let filtered = doctors.filter(doc => doc.specialty === selectedSpecialty);

    return filtered;
  };
  if (loading) {
    return <Loading />;
  }
  return (
    <>
      <div className='Background_Schedule'>
        <div className="section container mt-4">
          <h2>Virtual Consultation Scheduling</h2>
          <p>Browse and select from available doctors and schedule your appointment.</p>
          {!isAuthenticated ? (
            <div className="alert alert-warning text-center p-5" role="alert">
              <i className="fas fa-lock fa-3x mb-3"></i>
              <p className="mb-4">You need to login to schedule an appointment.</p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/login')}
              >
                <i className="fas fa-sign-in-alt me-2"></i>
                Login Now
              </button>
            </div>
          ) : (
            <>
              {/* ✅ STEP 1: Select Specialty */}
              <div className="form-group mb-3">
                <label className="fw-bold">
                  <i className="bi bi-hospital me-2"></i>
                  Select Specialty:
                </label>
                <select
                  className="form-control"
                  value={selectedSpecialty}
                  onChange={(e) => {
                    setSelectedSpecialty(e.target.value);
                    setSelectedDoctor('');
                  }}
                  disabled={!!doctorId}
                >
                  <option value="">-- Choose a Specialty --</option>
                  {getSpecialties().map((specialty, idx) => (
                    <option key={idx} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>
            
              {/* ✅ STEP 3: Doctor Dropdown - UPDATE label */}
              {selectedSpecialty && (
                <div className="form-group mb-3">
                  <label className="fw-bold">
                    <i className="bi bi-person-badge me-2"></i>
                    Select Doctor ({selectedSpecialty}):  {/* Keep existing */}
                  </label>
                  <select
                    className="form-control"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    disabled={!!doctorId}
                  >
                    <option value="">-- Choose a Doctor --</option>
                    {getFilteredDoctors().map(doc => (
                      <option key={doc.doctorID} value={doc.doctorID}>
                        {doc.fullName}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted d-block mt-2">
                    <i className="bi bi-info-circle me-1"></i>
                    {getFilteredDoctors().length} doctor(s) available in {selectedSpecialty}

                    {selectedDoctor && (() => {
                      const doctor = getFilteredDoctors().find(d => d.doctorID === selectedDoctor);
                      return doctor?.languageSpoken ? (
                        <>
                          <br />
                          <i className="bi bi-translate me-1"></i>
                          Languages Spoken: <strong>{doctor.languageSpoken}</strong>
                        </>
                      ) : null;
                    })()}
                  </small>

                  {doctorId && (
                    <div className="form-text text-info">
                      <i className="bi bi-check-circle me-1"></i>
                      Booking for specific doctor. <a href="/doctors">Change doctor?</a>
                    </div>
                  )}
                </div>
              )}
              {/* Rest of form - UNCHANGED */}
              <div className="form-group mb-3">
                <label className="fw-bold">Preferred Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-group mb-3">
                <label className="fw-bold">Available Time Slots:</label>
                {loadingSlots ? (
                  <div>Loading slots...</div>
                ) : (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {slots.length === 0 ? <span className="text-muted">No slots available for this date.</span> :
                      slots.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={!slot.isAvailable}
                          className={`btn ${selectedSlot === slot ? 'btn-success' : 'btn-outline-primary'} ${!slot.isAvailable ? 'disabled btn-secondary' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
              <div className="form-group mb-4">
                <label className="fw-bold">Consultation Type:</label>
                <select
                  className="form-control"
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                >
                  <option value="Video Call">Video Call</option>
                  <option value="Chat">Chat</option>
                </select>
              </div>
              <div>
                <button
                  className="btn btn-primary"
                  onClick={handleSchedule}
                  disabled={!selectedSlot}
                >
                  Schedule Appointment
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
export default Schedule;