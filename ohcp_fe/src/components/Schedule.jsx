import React, { useState, useEffect } from 'react';
import { appointmentService } from '../api/appointmentApi';
import { doctorService } from '../api/doctorApi';
import { useNavigate, useParams } from 'react-router-dom';
import './Css/Schedule.css';
import Loading from './Loading';
import { useAuth } from '../context/AuthContext';
import { handleAuthenticatedAction } from '../utils/authUtils';

function Schedule() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // default today (YYYY-MM-DD)
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('video');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { doctorId } = useParams();
  const { isAuthenticated } = useAuth();

  // 1. Load list of Doctors
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const data = await doctorService.getAllDoctors();

        setDoctors(data);

        // if (data.length > 0) setSelectedDoctor(data[0].doctorID);
        if (doctorId) {
          setSelectedDoctor(doctorId);
        }
      } catch (error) {
        console.error("Failed to load doctors", error);
      }
    }
    fetchDoctors();
  }, []);

  // 2. Load empty Slot list when changing Doctor or Date
  useEffect(() => {
    if (!selectedDoctor || !date) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        const data = await appointmentService.getAvailableSlots(selectedDoctor, date);
        setSlots(data);
        setSelectedSlot(null); // Reset slot choosing
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
        appointmentTime: selectedSlot.startTime, // Send format "YYYY-MM-DD HH:mm:ss"
        consultationType: consultationType
      };

      await appointmentService.createAppointment(bookingData);
      alert("Appointment scheduled successfully!");
      navigate('/my-appointments'); // Navigate to the "My Appointments" page if successful
    } catch (error) {
      alert(error.response?.data?.message || "Failed to schedule appointment.");
    }
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Giả lập thời gian load trang (có thể thay bằng logic load data thực tế)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // 1.5 giây

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
  <>
    <div className='Background_Schedule'>
      <div className="section container mt-4">
        <h2>Virtual Consultation Scheduling</h2>
        <p>Browse and select from available doctors and schedule your appointment.</p>

        {/* Kiểm tra authentication */}
        {!isAuthenticated ? (
          // HIỂN THỊ MESSAGE NẾU CHƯA ĐĂNG NHẬP
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
          // HIỂN THỊ FORM BOOKING NẾU ĐÃ ĐĂNG NHẬP
          <>
            <div className="form-group mb-3">
              <label className="fw-bold">Select Doctor:</label>
              <select
                className="form-control"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                disabled={!!doctorId}
              >
                <option value="">-- Choose a Doctor --</option>
                {doctors.map(doc => (
                  <option key={doc.doctorID} value={doc.doctorID}>
                    {doc.fullName} ({doc.specialty})
                  </option>
                ))}
              </select>
              {doctorId && (
                <div className="form-text">
                  Booking for specific doctor. <a href="/doctors">Change doctor?</a>
                </div>
              )}
            </div>

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
                <option value="video">Video Call</option>
                <option value="chat">Chat</option>
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