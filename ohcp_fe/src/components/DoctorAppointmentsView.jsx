import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService } from '../api/doctorApi';

export default function DoctorAppointmentsView({ doctorId, onViewAppointment }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!doctorId) return;
    
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await doctorService.getDoctorAppointments(doctorId);
        if (mounted) setAppointments(data || []);
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

  return (
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
          {appointments.map((a) => (
            <tr key={a.appointmentID} className="border-bottom hover-table-row">
              <td className="px-4 py-4 fw-medium text-dark fw-bold">#{a.appointmentID}</td>
              <td className="px-4 py-4 text-dark">{a.patient?.fullName || 'Unknown Patient'}</td>
              <td className="px-4 py-4 text-dark">
                {new Date(a.appointmentTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
              <td className="px-4 py-4 text-dark">
                {new Date(a.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-4 py-4">
                <span className={`type-badge ${
                  a.consultationType === 'Video Call' ? 'type-video' :
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
                <span className={`badge ${
                  a.status === 'Scheduled' ? 'bg-primary' :
                  a.status === 'Completed' ? 'bg-success' :
                  a.status === 'Cancelled' ? 'bg-danger' :
                  'bg-secondary'
                }`}>
                  {a.status}
                </span>
              </td>
              <td className="px-4 py-4 text-end">
                <button 
                  className="btn btn-view d-flex align-items-center justify-content-center ms-auto"
                  onClick={() => onViewAppointment ? onViewAppointment(a) : navigate(`/appointment/${a.appointmentID}`)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
