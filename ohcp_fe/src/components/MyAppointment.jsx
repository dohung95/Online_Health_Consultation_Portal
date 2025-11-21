import React, { useEffect, useState } from 'react';
import { appointmentService } from '../api/appointmentApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { roles, initiateCall } = useAuth();
    const { openChatWith } = useChat();

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const data = await appointmentService.getMyAppointments();
            setAppointments(data);
        } catch (error) {
            console.error("Error loading appointments:", error);
            if (error.response && error.response.status === 401) {
                alert("Phiên đăng nhập hết hạn.");
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        const confirm = window.confirm("Are you sure you want to cancel this appointment?");
        if (!confirm) return;

        try {
            await appointmentService.cancelAppointment(id, "Patient request");
            alert("Appointment cancelled successfully.");
            loadAppointments();
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data || "Failed to cancel.";
            alert(msg);
        }
    };

    const handleChat = async (appointment) => {
        const isDoctor = roles && roles.some(r => String(r).trim().toLowerCase() === 'doctor');
        const partnerData = isDoctor ? appointment.patient : appointment.doctor;
        const partnerID = isDoctor ? appointment.patientID : appointment.doctorID;

        if (!partnerData || !partnerID) {
            alert("Chat partner information is missing.");
            return;
        }

        // Firebase ID conversion depends on whether database ID has dashes or not:
        // - IDs with dashes (e.g., patient): Remove last 4 chars, then remove dashes
        //   Example: "1a8391a9-3d5f-4a22-ae74-ff2fe7d0a501" -> "1a8391a9-3d5f-4a22-ae74-ff2fe7d0" -> "1a8391a93d5f4a22ae74ff2fe7d0"
        // - IDs without dashes (e.g., doctor): Remove last 5 chars directly
        //   Example: "7ecdab692c6540869f9a0cde9c7027" -> "7ecdab692c6540869f9a0cde9c7"

        let firebaseID;
        if (partnerID.includes('-')) {
            // Has dashes: remove last 4 chars, then remove dashes
            const idWithout4Chars = partnerID.substring(0, partnerID.length - 4);
            firebaseID = idWithout4Chars.replace(/-/g, '');
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

    const handleVideoCall = (patientId) => {
        const targetUserId = patientId;
        const uniqueRoomId = `consultation-${Date.now()}`;
        initiateCall(targetUserId, uniqueRoomId);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Scheduled': return 'bg-success';
            case 'Cancelled': return 'bg-danger';
            case 'Completed': return 'bg-primary';
            default: return 'bg-secondary';
        }
    };

    if (loading) return <div className="container mt-4">Loading...</div>;

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>My Appointments</h2>
                <button className="btn btn-primary" onClick={() => navigate('/schedule')}>
                    + Book New Appointment
                </button>
            </div>

            {appointments.length === 0 ? (
                <div className="alert alert-info">You have no appointments yet.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover table-bordered shadow-sm">
                        <thead className="table-light">
                            <tr>
                                <th>Date & Time</th>
                                <th>Doctor</th>
                                <th>Patient</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((item) => (
                                <tr key={item.appointmentID}>
                                    <td>
                                        {new Date(item.appointmentTime).toLocaleDateString()} <br />
                                        <small className="text-muted">
                                            {new Date(item.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </small>
                                    </td>

                                    <td>
                                        <strong>{item.doctor?.fullName || "Unknown Doctor"}</strong>
                                        <br />
                                        <small className="text-muted">{item.doctor?.specialty}</small>
                                    </td>

                                    <td>
                                        <span className="text-capitalize">{item.patient?.fullName || "Unknown Patient"}</span>
                                        <br />
                                        <small className="text-muted">
                                            {item.patient?.dateOfBirth ? new Date(item.patient.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}
                                        </small>
                                    </td>

                                    <td>
                                        <span className="text-capitalize">{item.consultationType}</span>
                                    </td>

                                    <td>
                                        <span className={`badge ${getStatusBadge(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {item.consultationType === 'chat' && item.status === 'Scheduled' && (
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleChat(item)}
                                                    title="Start chat"
                                                >
                                                    <i className="bi bi-chat-dots me-1"></i>
                                                    Chat
                                                </button>
                                            )}

                                            {item.consultationType === 'video_call' && item.status === 'Scheduled' && (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleVideoCall(item.patientId)}
                                                    title="Start video call"
                                                >
                                                    <i className="bi bi-camera-video me-1"></i>
                                                    Call Now
                                                </button>
                                            )}

                                            {item.status === 'Scheduled' && (
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleCancel(item.appointmentID)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MyAppointments;