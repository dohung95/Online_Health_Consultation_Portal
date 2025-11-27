import axios from 'axios';

const API_URL = 'https://localhost:7267/api'; 

export const appointmentService = {
    getAvailableSlots: async (doctorId, date) => {
        const response = await axios.get(`${API_URL}/Appointment/available-slots`, {
            params: { doctorId, date }
        });
        return response.data;
    },

    createAppointment: async (data) => {
        const response = await axios.post(`${API_URL}/Appointment`, data);
        return response.data;
    },

    getMyAppointments: async () => {
        const response = await axios.get(`${API_URL}/Appointment`);
        return response.data;
    },

    cancelAppointment: async (id, reason) => {
        const response = await axios.put(`${API_URL}/Appointment/${id}/cancel`, { reason });
        return response.data;
    }
};