import React from 'react';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Для отладки: выводим user в консоль
    console.log('user:', user);

    // Вычисление дней до смены пароля
    let daysLeft = null;
    let lastChange = null;
    if (user) {
        lastChange = user.lastPasswordChange || user.LastPasswordChange;
    }
    if (user && lastChange) {
        const lastChangeDate = new Date(lastChange);
        const now = new Date();
        const diffDays = Math.floor((now - lastChangeDate) / (1000 * 60 * 60 * 24));
        const maxDays = user.role === 'admin' ? 180 : 365;
        daysLeft = maxDays - diffDays;
    }

    return (
        <div>
            <h1>Добро пожаловать</h1>
            {user && (
                <p>
                    Вы вошли как {user.username} ({user.role})
                </p>
            )}
            {user && daysLeft !== null && (
                <div style={{ marginTop: 20 }}>
                    <b>До обязательной смены пароля осталось: {daysLeft} дней</b>
                    <br />
                    <button className="btn btn-warning mt-2" onClick={() => navigate('/change-password')}>
                        Сменить пароль
                    </button>
                </div>
            )}
        </div>
    );
};

export default Home;