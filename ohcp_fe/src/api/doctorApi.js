import axios from 'axios';

const API_URL = 'https://localhost:7267/api'; 

// Helper to get auth header
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const doctorService = {
    // 1. Tìm kiếm (Có phân trang - Dùng cho trang DoctorList)
    searchDoctors: async (params) => {
        const response = await axios.get(`${API_URL}/Doctor/search`, { params });
        return response.data; 
    },

    // 2. Lấy TẤT CẢ (Không phân trang - Dùng cho Dropdown trang Schedule)
    getAllDoctors: async () => {
        const response = await axios.get(`${API_URL}/Doctor/all`);
        return response.data; // Trả về mảng []
    },

    // 3. Lấy chi tiết
    getDoctorById: async (id) => {
        const response = await axios.get(`${API_URL}/Doctor/${id}`);
        return response.data;
    },

    // 4. Lấy thông tin doctor hiện tại (từ token)
    getCurrentDoctor: async () => {
        const response = await axios.get(`${API_URL}/Doctor/current`, getAuthHeader());
        return response.data;
    },

    // 5. Lấy danh sách appointments của doctor
    getDoctorAppointments: async (doctorId) => {
        const response = await axios.get(`${API_URL}/Appointment/doctor/${doctorId}`, getAuthHeader());
        return response.data;
    },

    // 6. Lấy danh sách reviews của doctor
    getDoctorReviews: async (doctorId) => {
        const response = await axios.get(`${API_URL}/Review/doctor/${doctorId}`, getAuthHeader());
        return response.data;
    },

    // 7. Lấy thông tin patient theo ID
    getPatientById: async (patientId) => {
        const response = await axios.get(`${API_URL}/Patient/${patientId}`, getAuthHeader());
        return response.data;
    }
};