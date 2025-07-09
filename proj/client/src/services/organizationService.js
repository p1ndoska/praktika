import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const API_URL = `${API_BASE_URL}/api/organizations`;

const getOrganizations = async (token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(API_URL, config);
    return response.data;
};

export default { getOrganizations }; 