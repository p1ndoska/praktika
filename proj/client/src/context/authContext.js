import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Пытаемся восстановить пользователя из localStorage при инициализации
        const savedUser = localStorage.getItem('user');
        if (!savedUser || savedUser === 'undefined' || savedUser === 'null') {
            return null;
        }
        try {
            return JSON.parse(savedUser);
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            localStorage.removeItem('user'); // Очищаем некорректные данные
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        const savedToken = localStorage.getItem('token');
        if (!savedToken || savedToken === 'undefined' || savedToken === 'null') {
            return null;
        }
        return savedToken;
    });
    const navigate = useNavigate();

    const login = useCallback((userData) => {
        if (userData && userData.token && userData.user) {
            localStorage.setItem('token', userData.token);
            localStorage.setItem('user', JSON.stringify(userData.user));
            setToken(userData.token);
            setUser(userData.user);
            if (userData.user.mustChangePassword) {
                navigate('/change-password');
            } else {
                navigate('/records');
            }
        } else {
            console.error('Invalid userData provided to login:', userData);
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
        if (updatedUser) {
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } else {
            console.error('Invalid updatedUser provided to updateUser:', updatedUser);
        }
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

                if (userData && userData.id && userData.username) {
                    localStorage.setItem('user', JSON.stringify(userData));
                    setUser(userData);
                } else {
                    console.error('Invalid userData received from server:', userData);
                    logout();
                    return;
                }

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