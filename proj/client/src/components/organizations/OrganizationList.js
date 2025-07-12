import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import Pagination from '../Pagination';
import API_BASE_URL from '../../apiConfig';

const OrganizationList = () => {
  const { user, token } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const orgsPerPage = 15;
  const indexOfLastOrg = currentPage * orgsPerPage;
  const indexOfFirstOrg = indexOfLastOrg - orgsPerPage;
  const [search, setSearch] = useState("");
  const filteredOrgs = organizations.filter(org => org.Name.toLowerCase().includes(search.toLowerCase()));
  const currentOrgs = filteredOrgs.slice(indexOfFirstOrg, indexOfLastOrg);
  const totalPages = Math.ceil(filteredOrgs.length / orgsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(res.data);
    } catch (e) {
      setError('Ошибка загрузки списка организаций');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrganizations();
    // eslint-disable-next-line
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) return setError('Введите название организации');
    try {
      await axios.post(`${API_BASE_URL}/api/organizations`, { name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Организация добавлена');
      setName('');
      fetchOrganizations();
    } catch (e) {
      setError(e.response?.data?.message || 'Ошибка добавления');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту организацию?')) return;
    setError('');
    setSuccess('');
    try {
      await axios.delete(`${API_BASE_URL}/api/organizations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Организация удалена');
      fetchOrganizations();
    } catch (e) {
      setError(e.response?.data?.message || 'Ошибка удаления');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Организации</h2>
      <form onSubmit={handleAdd} className="mb-3">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Название организации"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Добавить</button>
        </div>
      </form>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Поиск по названию организации..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <>
        <ul className="list-group">
          {currentOrgs.map(org => (
            <li key={org.Id} className="list-group-item d-flex justify-content-between align-items-center">
              {org.Name}
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(org.Id)}>
                Удалить
              </button>
            </li>
          ))}
        </ul>
        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
        )}
        </>
      )}
    </div>
  );
};

export default OrganizationList; 