import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const login = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { username, password });
        return {
            token: response.data.token,
            user: response.data.user
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed');
    }
};

const changePassword = async (currentPassword, newPassword, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/change-password`,
            { currentPassword, newPassword },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Password change failed');
    }
};

export default { login, changePassword };