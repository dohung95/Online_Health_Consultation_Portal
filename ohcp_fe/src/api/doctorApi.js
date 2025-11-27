import axios from 'axios';

const API_URL = 'https://localhost:7267/api'; 

export const doctorService = {
    // 1. Search (pagination for Doctors)
    searchDoctors: async (params) => {
        const response = await axios.get(`${API_URL}/Doctor/search`, { params });
        return response.data; 
    },

    // 2. Search (no pagination for Dropdown Schedule)
    getAllDoctors: async () => {
        const response = await axios.get(`${API_URL}/Doctor/all`);
        return response.data; // return array []
    },

    // 3. Get by ID
    getDoctorById: async (id) => {
        const response = await axios.get(`${API_URL}/Doctor/${id}`);
        return response.data;
    }
};