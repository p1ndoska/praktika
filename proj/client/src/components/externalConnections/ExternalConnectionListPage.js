import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import ExternalConnectionList from './ExternalConnectionList';
import Pagination from '../Pagination';

const ExternalConnectionListPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(15);
  const [search, setSearch] = useState("");

  const fetchConnections = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.SERVER_URL}/api/external-connections?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConnections(response.data.data);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.totalItems || response.data.data.length);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Ошибка при загрузке списка подключений');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections(1);
  }, [token]);

  const handlePageChange = (page) => {
    fetchConnections(page);
  };

  const handleRefresh = () => {
    fetchConnections(currentPage);
  };

  const handleEdit = (id) => {
    navigate(`/external-connections/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить подключение?')) return;
    
    try {
      await axios.delete(`${process.env.SERVER_URL}/api/external-connections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Обновляем список после удаления
      fetchConnections(currentPage);
    } catch (err) {
      console.error('Error deleting connection:', err);
      setError('Ошибка при удалении подключения');
    }
  };

  const filteredConnections = connections.filter(conn => {
    const org = (conn.Organization || conn.organization || '').toLowerCase();
    const fio = (conn.FullName || conn.fullName || '').toLowerCase();
    const pos = (conn.Position || conn.position || '').toLowerCase();
    const email = (conn.Email || conn.email || '').toLowerCase();
    const phone = (conn.Phone || conn.phone || '').toLowerCase();
    return (
      org.includes(search.toLowerCase()) ||
      fio.includes(search.toLowerCase()) ||
      pos.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase()) ||
      phone.includes(search.toLowerCase())
    );
  });

  if (loading && connections.length === 0) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка списка подключений...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Внешние подключения</h1>
        <div>
          <button 
            className="btn btn-outline-secondary me-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Обновление...' : 'Обновить'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/external-connections/add')}
          >
            + Добавить подключение
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {connections.length === 0 && !loading ? (
        <div className="alert alert-info">
          <h4>Нет подключений</h4>
          <p>Внешние подключения не найдены. Создайте первое подключение.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/external-connections/add')}
          >
            Добавить подключение
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 mt-3">
            <input
              type="text"
              className="form-control"
              placeholder="Поиск по организации, ФИО, должности, email или телефону..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ExternalConnectionList
            connections={filteredConnections}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />

          {/* Пагинация */}
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}

        </>
      )}
    </div>
  );
};

export default ExternalConnectionListPage; 