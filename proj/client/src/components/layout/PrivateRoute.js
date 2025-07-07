import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const PrivateRoute = ({ children }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.firstLogin) {
        return <Navigate to="/change-password" replace />;
    }

    return children;
};

export default PrivateRoute;