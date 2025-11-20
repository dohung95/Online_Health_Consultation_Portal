import axios from 'axios';

const API_URL = 'https://localhost:7267/api'; 

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const appointmentService = {
    // 1. find docter
    searchDoctors: async (params) => {
        // params: { specialty, name, location }
        const response = await axios.get(`${API_URL}/Doctor/search`, { params });
        return response.data;
    },

    // 2. Detail Doctor
    getDoctorById: async (id) => {
        const response = await axios.get(`${API_URL}/Doctor/${id}`, getAuthHeader());
        return response.data;
    },

    // 3. Get available time slots (Integration with calendar)
    getAvailableSlots: async (doctorId, date) => {
        // date format: YYYY-MM-DD
        const response = await axios.get(`${API_URL}/Appointment/available-slots`, {
            params: { doctorId, date },
            ...getAuthHeader()
        });
        return response.data;
    },

    // 4. Schedule Appointment
    createAppointment: async (data) => {
        const response = await axios.post(`${API_URL}/Appointment`, data, getAuthHeader());
        return response.data;
    },

    // 5. Cancel Appointment
    cancelAppointment: async (id, reason) => {
        const response = await axios.put(`${API_URL}/Appointment/${id}/cancel`, { reason }, getAuthHeader());
        return response.data;
    },

    // 6. Get My Appointments
    getMyAppointments: async () => {
        const response = await axios.get(`${API_URL}/Appointment`, getAuthHeader());
        return response.data;
    },
};