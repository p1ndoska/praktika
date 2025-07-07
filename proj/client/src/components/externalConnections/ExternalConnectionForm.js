import React, { useState, useEffect } from 'react';
import axios from 'axios';
import organizationService from '../../services/organizationService';
import positionService from '../../services/positionService';
import { useAuth } from '../../context/authContext';
import Select from 'react-select';
import POSITIONS from '../../constants/positions';

function formatPhone(value) {
  // Удаляем всё, кроме цифр
  let digits = value.replace(/\D/g, '');
  // Удаляем ведущие 375, если пользователь случайно ввёл
  if (digits.startsWith('375')) digits = digits.slice(3);
  // Ограничиваем до 9 цифр (2 для кода, 7 для номера)
  digits = digits.slice(0, 9);
  let result = '+375';
  if (digits.length > 0) result += ' ' + digits.slice(0, 2);
  if (digits.length > 2) result += ' ' + digits.slice(2, 5);
  if (digits.length > 5) result += ' ' + digits.slice(5, 7);
  if (digits.length > 7) result += ' ' + digits.slice(7, 9);
  return result;
}

function PhoneInput({ value, onChange, name, className, placeholder, required }) {
  return (
    <input
      type="text"
      name={name}
      className={className}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={e => {
        const formatted = formatPhone(e.target.value);
        onChange({ target: { name, value: formatted } });
      }}
      maxLength={17}
      autoComplete="tel"
    />
  );
}

const ExternalConnectionForm = ({ 
  mode = 'add', // 'add' или 'edit'
  connection = null, // данные для редактирования
  onSuccess, // callback при успешном сохранении
  onCancel // callback при отмене
}) => {
  const { token } = useAuth();
  const [form, setForm] = useState({
    id: '',
    organizationId: '',
    fullName: '',
    position: '',
    email: '',
    phone: '',
    accessStart: '',
    accessEnd: ''
  });
  const [organizations, setOrganizations] = useState([]);
  const [positions, setPositions] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const isEditMode = mode === 'edit';

  // Загрузка организаций и должностей
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoading(true);
        const data = await organizationService.getOrganizations(token);
        const orgs = data.map(org => ({
          value: org.Id || org.id,
          label: org.Name || org.name
        }));
        setOrganizations(orgs);
      } catch (e) {
        console.error('Error fetching organizations:', e);
        setError('Не удалось загрузить список организаций');
      } finally {
        setIsLoading(false);
      }
    };
    const fetchPositions = async () => {
      try {
        setIsLoading(true);
        const data = await positionService.getPositions(token);
        const pos = data.map(p => ({ value: p.Name, label: p.Name }));
        setPositions(pos);
      } catch (e) {
        console.error('Error fetching positions:', e);
        setError('Не удалось загрузить список должностей');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrganizations();
    fetchPositions();
  }, [token]);

  // Установка данных формы при редактировании
  useEffect(() => {
    if (isEditMode && connection && organizations.length > 0) {
      // Найти organizationId по названию организации
      const org = organizations.find(o =>
        o.label === (connection.Organization || connection.organization)
      );

      // Форматирование дат для datetime-local
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().slice(0, 16);
      };

      setForm({
        id: connection.Id || connection.id,
        organizationId: org ? org.value : '',
        fullName: connection.FullName || connection.fullName || '',
        position: connection.Position || connection.position || '',
        email: connection.Email || connection.email || '',
        phone: connection.Phone || connection.phone || '',
        accessStart: formatDateForInput(connection.AccessStart || connection.accessStart),
        accessEnd: formatDateForInput(connection.AccessEnd || connection.accessEnd)
      });
    }
  }, [isEditMode, connection, organizations]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Очищаем ошибку поля при изменении
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleOrgChange = selectedOption => {
    setForm({ ...form, organizationId: selectedOption ? selectedOption.value : '' });
    if (fieldErrors.organizationId) {
      setFieldErrors(prev => ({ ...prev, organizationId: '' }));
    }
  };

  const handlePositionChange = selectedOption => {
    setForm({ ...form, position: selectedOption ? selectedOption.value : '' });
    if (fieldErrors.position) {
      setFieldErrors(prev => ({ ...prev, position: '' }));
    }
  };

  const validatePhone = phone => {
    if (!phone) return true;
    return /^\+375\s\d{2}\s\d{3}\s\d{2}\s\d{2}$/.test(phone);
  };

  const formatDateForServer = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toISOString();
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Валидация обязательных полей
    if (!form.organizationId) newErrors.organizationId = 'Организация обязательна';
    if (!form.fullName.trim()) newErrors.fullName = 'ФИО обязательно';
    if (!form.position) newErrors.position = 'Должность обязательна';
    if (!form.phone.trim()) newErrors.phone = 'Телефон обязателен';
    if (!form.email.trim()) newErrors.email = 'Email обязателен';
    if (!form.accessStart) newErrors.accessStart = 'Дата начала обязательна';
    if (!form.accessEnd) newErrors.accessEnd = 'Дата окончания обязательна';
    
    // Валидация email
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Некорректный email';
    }
    
    // Валидация телефона
    if (form.phone && !validatePhone(form.phone)) {
      newErrors.phone = 'Телефон должен быть в формате +375 xx xxx xx xx';
    }
    
    // Валидация дат
    if (form.accessStart && form.accessEnd && new Date(form.accessEnd) <= new Date(form.accessStart)) {
      newErrors.accessEnd = 'Дата окончания должна быть позже даты начала';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const requestData = {
        organizationId: form.organizationId,
        fullName: form.fullName,
        position: form.position,
        email: form.email,
        phone: form.phone,
        accessStart: formatDateForServer(form.accessStart),
        accessEnd: formatDateForServer(form.accessEnd)
      };

      console.log('Отправляемые данные:', requestData);

      const url = isEditMode ? `http://localhost:5000/api/external-connections/${form.id}` : 'http://localhost:5000/api/external-connections/add';
      const method = isEditMode ? 'put' : 'post';

      const response = await axios[method](url, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const successMessage = isEditMode ? 'Изменения успешно сохранены!' : 'Подключение успешно добавлено!';
      setMessage(successMessage);
      setError('');

      // Сброс формы только при добавлении
      if (!isEditMode) {
        setForm({
          id: '',
          organizationId: '',
          fullName: '',
          position: '',
          email: '',
          phone: '',
          accessStart: '',
          accessEnd: ''
        });
      }

      if (onSuccess) {
        setTimeout(() => {
          onSuccess(response.data);
        }, 1000);
      }
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        `Ошибка при ${isEditMode ? 'сохранении' : 'добавлении'}`;
      setError(errorMessage);
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode && !form.id) {
    return <div className="text-center p-4">Загрузка данных...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <h2 className="mb-3">
        {isEditMode ? 'Изменить подключение' : 'Добавить подключение'}
      </h2>
      
      {Object.keys(fieldErrors).length > 0 && (
        <div className="alert alert-danger">Пожалуйста, заполните все обязательные поля корректно.</div>
      )}

      <div className="mb-3">
        <label className="form-label">Организация *</label>
        <Select
          options={organizations}
          onChange={handleOrgChange}
          value={organizations.find(opt => opt.value === form.organizationId) || null}
          placeholder="Выберите организацию..."
          isClearable
          isLoading={isLoading && organizations.length === 0}
          className={fieldErrors.organizationId ? 'is-invalid' : ''}
        />
        {fieldErrors.organizationId && <div className="invalid-feedback d-block">{fieldErrors.organizationId}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">ФИО стороннего пользователя *</label>
        <input
          name="fullName"
          className={`form-control${fieldErrors.fullName ? ' is-invalid' : ''}`}
          placeholder="ФИО"
          value={form.fullName}
          onChange={handleChange}
          required
        />
        {fieldErrors.fullName && <div className="invalid-feedback d-block">{fieldErrors.fullName}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Должность *</label>
        <Select
          options={positions}
          onChange={handlePositionChange}
          value={positions.find(opt => opt.value === form.position) || null}
          placeholder="Выберите должность..."
          isClearable
          className={fieldErrors.position ? 'is-invalid' : ''}
        />
        {fieldErrors.position && <div className="invalid-feedback d-block">{fieldErrors.position}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Email *</label>
        <input
          type="email"
          name="email"
          className={`form-control${fieldErrors.email ? ' is-invalid' : ''}`}
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Телефон *</label>
        <PhoneInput
          name="phone"
          className={`form-control${fieldErrors.phone ? ' is-invalid' : ''}`}
          placeholder="+375 xx xxx xx xx"
          value={form.phone}
          onChange={handleChange}
          required
        />
        {fieldErrors.phone && <div className="invalid-feedback d-block">{fieldErrors.phone}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Дата начала доступа *</label>
        <input
          name="accessStart"
          type="datetime-local"
          className={`form-control${fieldErrors.accessStart ? ' is-invalid' : ''}`}
          value={form.accessStart}
          onChange={handleChange}
          required
        />
        {fieldErrors.accessStart && <div className="invalid-feedback d-block">{fieldErrors.accessStart}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">Дата окончания доступа *</label>
        <input
          name="accessEnd"
          type="datetime-local"
          className={`form-control${fieldErrors.accessEnd ? ' is-invalid' : ''}`}
          value={form.accessEnd}
          onChange={handleChange}
          required
        />
        {fieldErrors.accessEnd && <div className="invalid-feedback d-block">{fieldErrors.accessEnd}</div>}
      </div>

      <div className="d-flex justify-content-between">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (isEditMode ? 'Сохранение...' : 'Добавление...') : (isEditMode ? 'Сохранить' : 'Добавить')}
        </button>

        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Отмена
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger mt-2">{error}</div>}
      {message && <div className="alert alert-success mt-2">{message}</div>}
    </form>
  );
};

export default ExternalConnectionForm; 