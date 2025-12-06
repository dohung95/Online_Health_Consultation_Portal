import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../components/Css/DoctorPage.css';
import CreatePrescriptionModal from './CreatePrescriptionModal';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const DoctorAppointmentDetail = ({ appointment, patient, onBack }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const { roles, initiateCall } = useAuth();
  const { openChatWith } = useChat();

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

      console.log('Video Call Info:', {
        patientID,
        doctorID,
        patientName,
        doctorName,
        roomId,
        targetUserId,
        targetUserName
      });

      // Lấy tên bác sĩ hiện tại
      const currentDoctorName = doctorName || "Doctor";

      // Gọi hàm initiateCall với thông tin đầy đủ (bao gồm tên bác sĩ)
      initiateCall(targetUserId, roomId, targetUserName, currentDoctorName);

    } catch (error) {
      console.error("Error initiating video call:", error);
      alert("Unable to start video call.");
    }
  };

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
                    <div className={`rounded-circle ${appointment.status === 'Scheduled' ? 'bg-warning' :
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
                  <button
                    className="btn btn-primary h-auto py-3 fw-bold flex-fill"
                    onClick={() => {
                      if (appointment.consultationType === 'Video Call') {
                        handleVideoCall(appointment);
                      } else if (appointment.consultationType === 'Audio Call') {
                        handleVideoCall(appointment); // Audio cũng dùng Zego
                      } else if (appointment.consultationType === 'Chat') {
                        handleChat(appointment);
                      } else {
                        alert('Unknown consultation type');
                      }
                    }}
                    title={new Date(appointment.appointmentTime) < new Date() ? "Appointment time has passed" : `Join ${appointment.consultationType}`}
                    disabled={appointment.status !== 'Scheduled' || new Date(appointment.appointmentTime) < new Date()}
                  >
                    <i className={`bi ${appointment.consultationType === 'Video Call' ? 'bi-camera-video' :
                      appointment.consultationType === 'Audio Call' ? 'bi-telephone' :
                        appointment.consultationType === 'Chat' ? 'bi-chat-dots' :
                          'bi-door-open'
                      } me-2`}></i>
                    Join {appointment.consultationType || 'Appointment'}
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
