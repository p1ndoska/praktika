import React, { useEffect, useState } from 'react';
import curatorService from '../../services/curatorService';
import { useAuth } from '../../context/authContext';
import Pagination from '../Pagination';

const CuratorList = () => {
  const { token } = useAuth();
  const [curators, setCurators] = useState([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const curatorsPerPage = 15;
  const indexOfLastCurator = currentPage * curatorsPerPage;
  const indexOfFirstCurator = indexOfLastCurator - curatorsPerPage;
  const [search, setSearch] = useState("");
  const filteredCurators = curators.filter(cur => cur.Name.toLowerCase().includes(search.toLowerCase()));
  const currentCurators = filteredCurators.slice(indexOfFirstCurator, indexOfLastCurator);
  const totalPages = Math.ceil(filteredCurators.length / curatorsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const fetchCurators = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await curatorService.getCurators(token);
      setCurators(data);
    } catch (e) {
      setError('Ошибка при загрузке списка кураторов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurators();
    // eslint-disable-next-line
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newName.trim()) {
      setError('Имя обязательно');
      return;
    }
    try {
      setLoading(true);
      await curatorService.addCurator(newName, token);
      setNewName('');
      setSuccess('Куратор добавлен');
      fetchCurators();
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка при добавлении');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id, name) => {
    setEditId(id);
    setEditName(name);
    setError('');
    setSuccess('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!editName.trim()) {
      setError('Имя обязательно');
      return;
    }
    try {
      setLoading(true);
      await curatorService.updateCurator(editId, editName, token);
      setEditId(null);
      setEditName('');
      setSuccess('Куратор обновлен');
      fetchCurators();
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка при обновлении');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить куратора?')) return;
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await curatorService.deleteCurator(id, token);
      setSuccess('Куратор удален');
      fetchCurators();
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка при удалении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="mb-3">Кураторы</h2>
      <form onSubmit={handleAdd} className="mb-3 d-flex gap-2">
        <input
          type="text"
          className="form-control"
          placeholder="Новый куратор"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          disabled={loading}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>Добавить</button>
      </form>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Поиск по имени куратора..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Имя</th>
            <th style={{width: 180}}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {currentCurators.map(cur => (
            <tr key={cur.Id}>
              <td>
                {editId === cur.Id ? (
                  <form onSubmit={handleUpdate} className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      disabled={loading}
                    />
                    <button className="btn btn-success btn-sm" type="submit" disabled={loading}>OK</button>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditId(null)} disabled={loading}>Отмена</button>
                  </form>
                ) : (
                  <>{cur.Name}</>
                )}
              </td>
              <td>
                <div className="d-flex gap-1">
                  <button className="btn btn-primary btn-sm px-2" style={{whiteSpace: 'nowrap', minWidth: '70px'}} onClick={() => handleEdit(cur.Id, cur.Name)} disabled={loading}>Изменить</button>
                  <button className="btn btn-danger btn-sm px-2" style={{whiteSpace: 'nowrap', minWidth: '70px'}} onClick={() => handleDelete(cur.Id)} disabled={loading}>Удалить</button>
                </div>
              </td>
            </tr>
          ))}
          {curators.length === 0 && (
            <tr><td colSpan={2} className="text-center">Нет кураторов</td></tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
      )}
    </div>
  );
};

export default CuratorList; 