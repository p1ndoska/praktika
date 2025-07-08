import axios from 'axios';

const API_URL = `${process.env.SERVER_URL}/api/organizations`;

const getOrganizations = async (token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.get(API_URL, config);
    return response.data;
};

export default { getOrganizations }; 