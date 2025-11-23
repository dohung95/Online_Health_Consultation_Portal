import axios from 'axios';

const API_URL = 'https://localhost:7267/api'; 

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
    }
};