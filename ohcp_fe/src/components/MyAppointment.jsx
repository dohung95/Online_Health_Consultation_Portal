import React, { useEffect, useState } from 'react';
import { appointmentService } from '../api/appointmentApi';
import { useNavigate } from 'react-router-dom';

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Load list when mount
    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const data = await appointmentService.getMyAppointments();
            setAppointments(data);
        } catch (error) {
            console.error("Error loading appointments:", error);
            // If error 401 (Not logged in) then return to login page
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
            loadAppointments(); // Load list after cancel
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data || "Failed to cancel.";
            alert(msg);
        }
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
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((item) => (
                                <tr key={item.appointmentID}>

                                    <td>
                                        {new Date(item.appointmentTime).toLocaleDateString()} <br/>
                                        <small className="text-muted">
                                            {new Date(item.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </small>
                                    </td>
                                    
                                    <td>
                                        <strong>{item.doctor?.fullName || "Unknown Doctor"}</strong>
                                        <br/>
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
                                        {item.status === 'Scheduled' && (
                                            <button 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleCancel(item.appointmentID)}
                                            >
                                                Cancel
                                            </button>
                                        )}
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