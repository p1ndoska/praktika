import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import ExternalConnectionForm from './ExternalConnectionForm';

const EditExternalConnectionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConnection = async () => {
      try {
        setLoading(true);
        console.log('Загружаем подключение с ID:', id);
        
        const response = await axios.get(`http://192.168.1.195:5000/api/external-connections?page=1&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Полученные данные:', response.data);
        
        const foundConnection = response.data.data.find(conn => 
          (conn.Id || conn.id) === parseInt(id)
        );
        
        console.log('Найденное подключение:', foundConnection);
        
        if (foundConnection) {
          setConnection(foundConnection);
        } else {
          setError('Подключение не найдено');
        }
      } catch (err) {
        console.error('Error fetching connection:', err);
        setError('Ошибка при загрузке данных подключения');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchConnection();
    }
  }, [id, token]);

  const handleSuccess = () => {
    // После успешного сохранения перенаправляем на список
    navigate('/external-connections');
  };

  const handleCancel = () => {
    // При отмене возвращаемся к списку
    navigate('/external-connections');
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка данных подключения...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Ошибка</h4>
        <p>{error}</p>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate('/external-connections')}
        >
          ← Вернуться к списку
        </button>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="alert alert-warning">
        <h4>Подключение не найдено</h4>
        <p>Запрашиваемое подключение не существует или было удалено.</p>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate('/external-connections')}
        >
          ← Вернуться к списку
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Редактировать внешнее подключение</h1>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate('/external-connections')}
        >
          ← Вернуться к списку
        </button>
      </div>
      
      <ExternalConnectionForm
        mode="edit"
        connection={connection}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditExternalConnectionPage; 