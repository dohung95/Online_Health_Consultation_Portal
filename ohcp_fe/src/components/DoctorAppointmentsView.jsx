import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Form } from 'react-bootstrap';
import { doctorService } from '../api/doctorApi';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function DoctorAppointmentsView({ doctorId, onViewAppointment, viewedAppointments = [] }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { roles, initiateCall } = useAuth();
  const { openChatWith } = useChat();
  
  // Filter state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 8;

  useEffect(() => {
    if (!doctorId) return;

    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await doctorService.getDoctorAppointments(doctorId);
        if (mounted) {
          setAppointments(data || []);
          setFilteredAppointments(data || []);
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
        if (mounted) setError('Failed to load appointments');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [doctorId]);

  // Apply filters based on status and date
  const applyFilters = () => {
    let filtered = [...appointments];

    // Filter by status
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    // Filter by date
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointmentDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredAppointments(filtered);
    setFilterActive(selectedStatus !== 'All' || selectedDate !== '');
    setCurrentPage(1);
  };

  // Apply filters when selectedStatus or appointments changes
  useEffect(() => {
    if (appointments.length > 0) {
      applyFilters();
    }
  }, [selectedStatus, appointments]);

  // Pagination logic
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger m-4">{error}</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <p>No appointments found.</p>
      </div>
    );
  }

  const handleChat = async (appointment) => {
    const isDoctor = roles && roles.some(r => String(r).trim().toLowerCase() === 'doctor');
    const partnerData = isDoctor ? appointment.patient : appointment.doctor;
    const partnerID = isDoctor ? appointment.patient?.patientID : appointment.doctorID;  // ← SỬA ĐÂY

    if (!partnerData || !partnerID) {
      alert("Chat partner information is missing.");
      return;
    }

    let firebaseID;
    if (partnerID.includes('-')) {
      // Has dashes: CHỈ remove last 4 chars, GIỮ NGUYÊN dấu gạch ngang
      firebaseID = partnerID.substring(0, partnerID.length - 4);  // ← SỬA ĐÂY
    } else {
      // No dashes: remove last 5 chars directly
      firebaseID = partnerID.substring(0, partnerID.length - 5);
    }

    console.log(`[Chat] Opening chat with ${isDoctor ? 'Patient' : 'Doctor'}`);

    try {
      const usersRef = collection(db, "users");

      // Try as document ID first
      let q = query(usersRef, where("__name__", "==", firebaseID));
      let querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const partnerUser = { ...querySnapshot.docs[0].data(), uid: querySnapshot.docs[0].id };
        openChatWith(partnerUser);
        return;
      }

      // Try as uid field
      q = query(usersRef, where("uid", "==", firebaseID));
      querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const partnerUser = { ...querySnapshot.docs[0].data(), uid: querySnapshot.docs[0].id };
        console.log(`[Chat] ✓ Found by uid field:`, partnerUser);
        openChatWith(partnerUser);
        return;
      }

      console.warn(`[Chat] ✗ Could not find user with Firebase ID: ${firebaseID}`);
      alert(`Could not find chat user. They may not have registered in the chat system yet.`);
    } catch (error) {
      console.error("[Chat] Error:", error);
      alert("Error initiating chat.");
    }
  };

  const handleVideoCall = async (appointment) => {
    try {
      // Lấy thông tin từ appointment (patientID và doctorID nằm trong nested objects)
      const patientID = appointment.patient?.patientID || appointment.patientID;
      const doctorID = appointment.doctorID;
      const patientName = appointment.patient?.fullName || "Patient";
      const doctorName = appointment.doctor?.fullName || "Doctor";

      // Kiểm tra xem user hiện tại là ai
      const isDoctor = roles && roles.some(r => String(r).trim().toLowerCase() === 'doctor');

      // Xác định target user (người được gọi)
      const targetUserId = isDoctor ? patientID : doctorID;
      const targetUserName = isDoctor ? patientName : doctorName;

      // Tạo Room ID bằng cách trộn DoctorID + PatientID và lấy 40 ký tự
      // const combinedId = doctorID + patientID;
      // const roomId = combinedId.substring(0, 40);

      // Tạo Room ID ngẫu nhiên 45 ký tự
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let roomId = '';
      for (let i = 0; i < 45; i++) {
        roomId += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // console.log('Video Call Info:', {
      //   patientID,
      //   doctorID,
      //   patientName,
      //   doctorName,
      //   roomId,
      //   targetUserId,
      //   targetUserName
      // });

      // Lấy tên bác sĩ hiện tại
      const currentDoctorName = doctorName || "Doctor";

      // Gọi hàm initiateCall với thông tin đầy đủ (bao gồm tên bác sĩ)
      initiateCall(targetUserId, roomId, targetUserName, currentDoctorName);

    } catch (error) {
      console.error("Error initiating video call:", error);
      alert("Unable to start video call.");
    }
  };

  // Filter by date
  const handleDateFilter = () => {
    if (!selectedDate) {
      applyFilters();
      setFilterActive(false);
      return;
    }

    const filterDate = new Date(selectedDate);
    const filtered = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate.toDateString() === filterDate.toDateString();
    });

    setFilteredAppointments(filtered);
    setFilterActive(true);
    setShowDatePicker(false);
    setCurrentPage(1);
  };

  const clearFilter = () => {
    setSelectedDate('');
    setSelectedStatus('All');
    setFilteredAppointments(appointments);
    setFilterActive(false);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center p-3 pb-0">
        <div className="d-flex gap-2">
          {/* Status Filter Dropdown */}
          <div className="dropdown">
            <Button
              variant="outline-secondary"
              size="sm"
              className="dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bi bi-funnel me-2"></i>
              Status: {selectedStatus}
            </Button>
            <ul className="dropdown-menu">
              <li>
                <a className={`dropdown-item ${selectedStatus === 'All' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); handleStatusChange('All'); }}>
                  All
                </a>
              </li>
              <li>
                <a className={`dropdown-item ${selectedStatus === 'Scheduled' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); handleStatusChange('Scheduled'); }}>
                  Scheduled
                </a>
              </li>
              <li>
                <a className={`dropdown-item ${selectedStatus === 'Completed' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); handleStatusChange('Completed'); }}>
                  Completed
                </a>
              </li>
              <li>
                <a className={`dropdown-item ${selectedStatus === 'Cancelled' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); handleStatusChange('Cancelled'); }}>
                  Cancelled
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="position-relative">
          <Button 
            variant="outline-primary"
            onClick={() => setShowDatePicker(!showDatePicker)}
            size="sm"
          >
            <i className="bi bi-calendar-check me-2"></i>
            Filter by Date
          </Button>
          
          {showDatePicker && (
            <Card className="position-absolute end-0 mt-2 shadow-lg" style={{ zIndex: 1000, minWidth: '300px' }}>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Select Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="flex-grow-1"
                    onClick={handleDateFilter}
                  >
                    Apply Filter
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => {
                      clearFilter();
                      setShowDatePicker(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>

      {filterActive && (
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-3 mx-3">
          <span>
            <i className="bi bi-funnel-fill me-2"></i>
            {selectedDate && <span>Date: <strong>{new Date(selectedDate).toLocaleDateString()}</strong></span>}
            {selectedDate && selectedStatus !== 'All' && <span className="mx-2">|</span>}
            {selectedStatus !== 'All' && <span>Status: <strong>{selectedStatus}</strong></span>}
          </span>
          <Button variant="link" size="sm" onClick={clearFilter}>
            Clear Filter
          </Button>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-borderless align-middle mb-0">
          <thead className="table-header">
            <tr>
              <th scope="col" className="px-4 py-3">ID</th>
              <th scope="col" className="px-4 py-3">Patient</th>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3">Time</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-end"></th>
            </tr>
          </thead>
          <tbody>
            {currentAppointments.map((a) => (
              <tr key={a.appointmentID} className="border-bottom hover-table-row">
                <td className="px-4 py-4 fw-medium text-dark fw-bold">
                  #{a.appointmentID}
                  {!viewedAppointments.includes(a.appointmentID) && (
                    <span className="badge bg-success ms-2 small">NEW</span>
                  )}
                </td>
                <td className="px-4 py-4 text-dark">{a.patient?.fullName || 'Unknown Patient'}</td>
                <td className="px-4 py-4 text-dark">
                  {new Date(a.appointmentTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-4 text-dark">
                  {new Date(a.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-4">
                  <span className={`type-badge ${a.consultationType === 'Video Call' ? 'type-video' :
                    a.consultationType === 'Audio Call' ? 'type-audio' :
                      a.consultationType === 'Chat' ? 'type-chat' :
                        'type-video'
                    }`}>
                    <span className="material-symbols-outlined me-1" style={{ fontSize: '1rem' }}>
                      {a.consultationType === 'Video Call' ? 'videocam' :
                        a.consultationType === 'Audio Call' ? 'call' :
                          a.consultationType === 'Chat' ? 'chat' :
                            'videocam'}
                    </span>
                    {a.consultationType || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`badge ${a.status === 'Scheduled' ? 'bg-primary' :
                    a.status === 'Completed' ? 'bg-success' :
                      a.status === 'Cancelled' ? 'bg-danger' :
                        'bg-secondary'
                    }`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-end">
                  <div className="d-flex gap-2 align-items-center justify-content-end flex-nowrap">
                    {a.consultationType === 'Chat' && a.status === 'Scheduled' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleChat(a)}
                        title={new Date(a.appointmentTime) < new Date() ? "Appointment time has passed" : "Start chat"}
                        disabled={new Date(a.appointmentTime) < new Date()}
                      >
                        <i className="bi bi-chat-dots me-1"></i>
                        Chat
                      </button>
                    )}

                    {a.consultationType === 'Video Call' && a.status === 'Scheduled' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleVideoCall(a)}  // ← Truyền cả object "item"
                        title={new Date(a.appointmentTime) < new Date() ? "Appointment time has passed" : "Start video call"}
                        disabled={new Date(a.appointmentTime) < new Date()}
                      >
                        <i className="bi bi-camera-video me-1"></i>
                        Call Now
                      </button>
                    )}

                    <button
                      className="btn btn-view d-flex align-items-center justify-content-center"
                      onClick={() => onViewAppointment ? onViewAppointment(a) : navigate(`/appointment/${a.appointmentID}`)}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredAppointments.length > appointmentsPerPage && (
        <div className="d-flex justify-content-between align-items-center p-3 border-top">
          <div className="text-muted small">
            Showing {indexOfFirstAppointment + 1} to {Math.min(indexOfLastAppointment, filteredAppointments.length)} of {filteredAppointments.length} appointments
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <i className="bi bi-chevron-left me-1"></i>
              Previous
            </Button>
            <div className="d-flex align-items-center px-3">
              <span className="fw-semibold">Page {currentPage} of {totalPages}</span>
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <i className="bi bi-chevron-right ms-1"></i>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
