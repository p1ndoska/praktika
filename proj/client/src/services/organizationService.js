import axios from 'axios';

const API_URL = `http://192.168.1.195:5000/api/organizations`;

const getOrganizations = async (token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(API_URL, config);
    return response.data;
};

export default { getOrganizations }; 