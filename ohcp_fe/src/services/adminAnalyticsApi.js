import axios from 'axios';

const API_URL = 'https://localhost:7267/api/admin/analytics';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const analyticsApi = {
    getPatientRegistrations: async (year = 0) => {
        const response = await axios.get(`${API_URL}/patient-registrations`, {
            params: { year },
            headers: getAuthHeader()
        });
        return response.data;
    },

    getAppointmentsByWeek: async (year = 0, month = 0) => {
        const response = await axios.get(`${API_URL}/appointments-by-week`, {
            params: { year, month },
            headers: getAuthHeader()
        });
        return response.data;
    },

    getAppointmentsByMonth: async (year = 0) => {
        const response = await axios.get(`${API_URL}/appointments-by-month`, {
            params: { year },
            headers: getAuthHeader()
        });
        return response.data;
    },

    getRevenueByMonth: async (year = 0) => {
        const response = await axios.get(`${API_URL}/revenue-by-month`, {
            params: { year },
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default analyticsApi;
