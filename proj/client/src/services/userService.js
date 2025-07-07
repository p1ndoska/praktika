import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

// Глобальный перехватчик для обработки 401 Unauthorized
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const getUsers = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    const response = await axios.get(API_URL, config);
    return response.data;
};

const createUser = async (userData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    const response = await axios.post(API_URL, userData, config);
    return response.data;
};

const deleteUser = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
    const response = await axios.delete(`${API_URL}/${id}`, config);
    return response.data;
};

const updateUser = async (id, userData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios.put(
            `${API_URL}/${id}`,
            userData,
            config
        );

        return response.data;
    } catch (error) {
        // Улучшенная обработка ошибок
        if (error.response) {
            // Сервер ответил с ошибкой
            throw new Error(error.response.data.message || 'Ошибка обновления пользователя');
        } else if (error.request) {
            // Запрос был отправлен, но ответ не получен
            throw new Error('Нет ответа от сервера. Проверьте подключение к интернету.');
        } else {
            // Что-то пошло не так при настройке запроса
            throw new Error('Ошибка при отправке запроса');
        }
    }
};

export default { getUsers, createUser, deleteUser, updateUser };