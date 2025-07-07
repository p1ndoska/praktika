import React from 'react';
import { useNavigate } from 'react-router-dom';
import ExternalConnectionForm from './ExternalConnectionForm';

const AddExternalConnectionPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // После успешного добавления перенаправляем на список
    navigate('/external-connections');
  };

  const handleCancel = () => {
    // При отмене возвращаемся к списку
    navigate('/external-connections');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Добавить внешнее подключение</h1>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate('/external-connections')}
        >
          ← Вернуться к списку
        </button>
      </div>
      
      <ExternalConnectionForm
        mode="add"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AddExternalConnectionPage; 