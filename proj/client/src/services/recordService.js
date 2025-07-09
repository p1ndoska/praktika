import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const API_URL = `${API_BASE_URL}/api/records`;

const getRecords = async (token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(API_URL, config);
    return response.data;
};

const createRecord = async (recordData, token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(API_URL, recordData, config);
    return response.data;
};

const updateRecord = async (id, recordData, token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.put(`${API_URL}/${id}`, recordData, config);
    return response.data;
};

const deleteRecord = async (id, token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.delete(`${API_URL}/${id}`, config);
    return response.data;
};

export default { getRecords, createRecord, updateRecord, deleteRecord };