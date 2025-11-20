import React, { useState, useEffect } from 'react';
import { appointmentService } from '../api/appointmentApi';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './Css/Schedule.css';
import Loading from './Loading';

function Schedule() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // default today (YYYY-MM-DD)
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('video');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // 1. Load list of Doctors
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const data = await appointmentService.searchDoctors({});
        setDoctors(data);
        // Automatically select the first doctor
        if (data.length > 0) setSelectedDoctor(data[0].doctorID);
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

  const handleNavigateManage = () => {
    navigate('/my-appointments');
  };


  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Giả lập thời gian load trang (có thể thay bằng logic load data thực tế)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5 giây

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className='Background_Schedule'>
        <div className='container'>
                    <Navbar />
                </div>
        <div className="section container mt-4">
          <h2>Virtual Consultation Scheduling</h2>
          <p>Browse and select from available doctors and schedule your appointment.</p>

          <div className="form-group mb-3">
            <label className="fw-bold">Select Doctor:</label>
            <select
              className="form-control"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option value="">-- Choose a Doctor --</option>
              {doctors.map(doc => (
                <option key={doc.doctorID} value={doc.doctorID}>
                  {doc.fullName} ({doc.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group mb-3">
            <label className="fw-bold">Preferred Date:</label>
            <input
              type="date"
              className="form-control"
              value={date}
              min={new Date().toISOString().split('T')[0]} // don't allow past dates
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
              disabled={!selectedSlot} // Disable if no slot is selected
            >
              Schedule Appointment
            </button>

            <button
              className="btn btn-secondary ml-2"
              onClick={handleNavigateManage}
              style={{ marginLeft: '10px' }}
            >
              Manage/Cancel Appointments
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Schedule;