import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Пытаемся восстановить пользователя из localStorage при инициализации
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [token, setToken] = useState(localStorage.getItem('token'));
    const navigate = useNavigate();

    const login = useCallback((userData) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData.user));
        setToken(userData.token);
        setUser(userData.user);
        if (userData.user.mustChangePassword) {
            navigate('/change-password');
        } else {
            navigate('/records');
        }
    }, [navigate]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const updateUser = useCallback((updatedUser) => {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    }, []);

    useEffect(() => {
        const validateToken = async () => {
            if (token && user) return; // Если уже есть пользователь, пропускаем

            try {
                const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const userData = {
                    id: response.data.id,
                    username: response.data.username,
                    role: response.data.role,
                    firstLogin: response.data.firstLogin,
                    mustChangePassword: response.data.mustChangePassword,
                    email: response.data.email,
                    phone: response.data.phone,
                    position: response.data.position,
                    lastPasswordChange: response.data.lastPasswordChange
                };

                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);

                if (userData.firstLogin || userData.mustChangePassword) {
                    navigate('/change-password');
                }
            } catch (error) {
                console.error('Token validation failed:', error);
                logout(); // Очищаем невалидную сессию
            }
        };

        if (token) {
            validateToken();
        }
    }, [token, navigate, logout]);

    const value = {
        user,
        token,
        login,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};