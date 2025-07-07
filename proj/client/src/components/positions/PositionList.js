import React, { useEffect, useState } from 'react';
import positionService from '../../services/positionService';
import { useAuth } from '../../context/authContext';
import Pagination from '../Pagination';

const PositionList = () => {
  const { token } = useAuth();
  const [positions, setPositions] = useState([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const positionsPerPage = 15;
  const indexOfLastPosition = currentPage * positionsPerPage;
  const indexOfFirstPosition = indexOfLastPosition - positionsPerPage;
  const [search, setSearch] = useState("");
  const filteredPositions = positions.filter(pos => pos.Name.toLowerCase().includes(search.toLowerCase()));
  const currentPositions = filteredPositions.slice(indexOfFirstPosition, indexOfLastPosition);
  const totalPages = Math.ceil(filteredPositions.length / positionsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const fetchPositions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await positionService.getPositions(token);
      setPositions(data);
    } catch (e) {
      setError('Ошибка при загрузке списка должностей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
    // eslint-disable-next-line
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newName.trim()) {
      setError('Название обязательно');
      return;
    }
    try {
      setLoading(true);
      await positionService.addPosition(newName, token);
      setNewName('');
      setSuccess('Должность добавлена');
      fetchPositions();
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
      setError('Название обязательно');
      return;
    }
    try {
      setLoading(true);
      await positionService.updatePosition(editId, editName, token);
      setEditId(null);
      setEditName('');
      setSuccess('Должность обновлена');
      fetchPositions();
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка при обновлении');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить должность?')) return;
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await positionService.deletePosition(id, token);
      setSuccess('Должность удалена');
      fetchPositions();
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка при удалении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="mb-3">Должности</h2>
      <form onSubmit={handleAdd} className="mb-3 d-flex gap-2">
        <input
          type="text"
          className="form-control"
          placeholder="Новая должность"
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
          placeholder="Поиск по названию должности..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Название</th>
            <th style={{width: 120}}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {currentPositions.map(pos => (
            <tr key={pos.Id}>
              <td>
                {editId === pos.Id ? (
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
                  <>{pos.Name}</>
                )}
              </td>
              <td>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(pos.Id, pos.Name)} disabled={loading}>Изменить</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(pos.Id)} disabled={loading}>Удалить</button>
                </div>
              </td>
            </tr>
          ))}
          {positions.length === 0 && (
            <tr><td colSpan={2} className="text-center">Нет должностей</td></tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
      )}
    </div>
  );
};

export default PositionList; 