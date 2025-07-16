import React from 'react';

const ExternalConnectionList = ({ connections, onEdit, onDelete, loading = false }) => {
  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p className="mt-2">Загрузка подключений...</p>
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <div className="alert alert-info">
        <h4>Нет подключений</h4>
        <p>Внешние подключения не найдены.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover mb-0">
            <thead>
              <tr>
                <th scope="col">Организация</th>
                <th scope="col">ФИО</th>
                <th scope="col">Должность</th>
                <th scope="col">Email</th>
                <th scope="col">Телефон</th>
                <th scope="col">Объект подключения</th>
                <th scope="col">Дата начала</th>
                <th scope="col">Дата окончания</th>
                <th scope="col">Действия</th>
              </tr>
            </thead>
            <tbody>
              {connections.map(conn => {
                const startDate = conn.AccessStart || conn.accessStart;
                const endDate = conn.AccessEnd || conn.accessEnd;
                const now = new Date();
                const isActive = startDate && new Date(startDate) <= now && 
                               (!endDate || new Date(endDate) > now);
                const isExpired = endDate && new Date(endDate) <= now;
                const isFuture = startDate && new Date(startDate) > now;

                let status = 'Неизвестно';
                let statusClass = 'bg-secondary';
                
                if (isActive) {
                  status = 'Активно';
                  statusClass = 'bg-success';
                } else if (isExpired) {
                  status = 'Истекло';
                  statusClass = 'bg-danger';
                } else if (isFuture) {
                  status = 'Будущее';
                  statusClass = 'bg-warning';
                }

                return (
                  <tr key={conn.Id || conn.id}>
                    <td>{conn.Organization || conn.organization}</td>
                    <td>{conn.FullName || conn.fullName}</td>
                    <td>{conn.Position || conn.position}</td>
                    <td>
                      <a href={`mailto:${conn.Email || conn.email}`} className="text-decoration-none">
                        {conn.Email || conn.email}
                      </a>
                    </td>
                    <td>
                      <a href={`tel:${conn.Phone || conn.phone}`} className="text-decoration-none">
                        {conn.Phone || conn.phone}
                      </a>
                    </td>
                    <td>{conn.ObjectName || conn.objectName || 'Не указано'}</td>
                    <td>
                      {startDate ? new Date(startDate).toLocaleString('ru-RU') : 'Не указано'}
                    </td>
                    <td>
                      {endDate ? new Date(endDate).toLocaleString('ru-RU') : 'Не указано'}
                    </td>
                    <td>
                      <div className="btn-group " role="group" aria-label="Действия">
                        <button
                          onClick={() => onEdit(conn.Id || conn.id)}
                          className="btn btn-primary btn-sm me-2 rounded"
                          title="Редактировать"
                        >
                          <i className="bi bi-pencil"></i> Изменить
                        </button>
                        <button
                          onClick={() => onDelete(conn.Id || conn.id)}
                          className="btn btn-danger btn-sm rounded"
                          title="Удалить"
                        >
                          <i className="bi bi-trash"></i> Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExternalConnectionList; 