import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import axios from 'axios';
import API_BASE_URL from '../../apiConfig';
import positionService from '../../services/positionService';
import curatorService from '../../services/curatorService';
import './RecordForms.css';

function formatPhone(value) {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('375')) digits = digits.slice(3);
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

const RecordForm = ({ 
    mode = 'create', // 'create' или 'edit'
    initialData = null, // данные для редактирования
    onSubmit, // callback для отправки формы
    onCancel // callback для отмены
}) => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState({});
    const [organizations, setOrganizations] = useState([]);
    const [externalConnections, setExternalConnections] = useState([]);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [positions, setPositions] = useState([]);
    const [positionsLoading, setPositionsLoading] = useState(false);
    const [positionsError, setPositionsError] = useState('');
    const [curators, setCurators] = useState([]);
    const [curatorsLoading, setCuratorsLoading] = useState(false);
    const [curatorsError, setCuratorsError] = useState('');

    const [formData, setFormData] = useState({
        UserFullName: '',
        Position: '',
        Email: '',
        Phone: '',
        OrganizationName: '',
        ExternalUserName: '',
        ExternalUserPosition: '',
        ExternalUserEmail: '',
        ExternalUserPhone: '',
        ObjectName: '',
        WorkTypes: '',
        AccessType: 'локальный',
        AccessStartDate: '',
        AccessEndDate: '',
        ActualConnectionDate: '',
        ActualDisconnectionDate: '',
        Curator: '',
        Executor: '',
        Notes: ''
    });

    const isEditMode = mode === 'edit';

    // Инициализация данных пользователя
    useEffect(() => {
        if (user) {
            console.log('Setting user data:', user); // Отладочная информация
            setFormData(prev => ({
                ...prev,
                UserFullName: user.username || '',
                Position: user.position || user.Position || '',
                Email: user.email || '',
                Phone: user.phone || user.Phone || '',
                Executor: user.username || ''
            }));
        }
    }, [user]);

    // Загрузка данных для редактирования
    useEffect(() => {
        if (isEditMode && initialData) {
            const formatDateForInput = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toISOString().slice(0, 16);
            };

            console.log('Setting edit data:', initialData); // Отладочная информация
            console.log('Current user:', user); // Отладочная информация

            setFormData({
                ...initialData,
                AccessStartDate: formatDateForInput(initialData.AccessStartDate),
                AccessEndDate: formatDateForInput(initialData.AccessEndDate),
                ActualConnectionDate: formatDateForInput(initialData.ActualConnectionDate),
                ActualDisconnectionDate: formatDateForInput(initialData.ActualDisconnectionDate),
                // Автоматически заполняем исполнителя именем текущего пользователя, если поле пустое
                Executor: initialData.Executor || user?.username || ''
            });
        }
    }, [isEditMode, initialData, user]);

    // Загрузка справочных данных
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const res = await axios.get('/api/organizations', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrganizations(res.data);
            } catch (e) {
                setOrganizations([]);
            }
        };
        fetchOrganizations();

        const fetchConnections = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/external-connections`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setExternalConnections(res.data.data || res.data);
            } catch (e) {
                setExternalConnections([]);
            }
        };
        fetchConnections();

        const fetchPositions = async () => {
            setPositionsLoading(true);
            setPositionsError('');
            try {
                const data = await positionService.getPositions(token);
                setPositions(data.map(p => ({ value: p.Name, label: p.Name })));
            } catch (e) {
                setPositionsError('Ошибка при загрузке должностей');
            } finally {
                setPositionsLoading(false);
            }
        };
        fetchPositions();

        const fetchCurators = async () => {
            setCuratorsLoading(true);
            setCuratorsError('');
            try {
                const data = await curatorService.getCurators(token);
                setCurators(data.map(c => ({ value: c.Name, label: c.Name })));
            } catch (e) {
                setCuratorsError('Ошибка при загрузке кураторов');
            } finally {
                setCuratorsLoading(false);
            }
        };
        fetchCurators();
    }, [token]);

    const validateForm = () => {
        const newErrors = {};

        // Required fields validation
        if (!formData.UserFullName.trim()) newErrors.UserFullName = 'ФИО обязательно';
        if (!formData.Position) newErrors.Position = 'Должность обязательна';
        if (!formData.ObjectName.trim()) newErrors.ObjectName = 'Объект подключения обязателен';
        if (!formData.AccessStartDate) newErrors.AccessStartDate = 'Дата начала доступа обязательна';

        // Email validation
        if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
            newErrors.Email = 'Некорректный email';
        }
        if (formData.ExternalUserEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ExternalUserEmail)) {
            newErrors.ExternalUserEmail = 'Некорректный email';
        }

        // Phone validation
        if (formData.Phone && !/^[\d\s+\-()]{6,20}$/.test(formData.Phone)) {
            newErrors.Phone = 'Некорректный телефон';
        }
        if (formData.ExternalUserPhone && !/^[\d\s+\-()]{6,20}$/.test(formData.ExternalUserPhone)) {
            newErrors.ExternalUserPhone = 'Некорректный телефон';
        }

        // Date validation
        if (formData.AccessEndDate && new Date(formData.AccessEndDate) < new Date(formData.AccessStartDate)) {
            newErrors.AccessEndDate = 'Дата окончания должна быть позже даты начала';
        }
        if (formData.ActualConnectionDate) {
            if (formData.AccessStartDate && new Date(formData.ActualConnectionDate) < new Date(formData.AccessStartDate)) {
                newErrors.ActualConnectionDate = 'Фактическое подключение не может быть раньше срока предоставления доступа';
            }
            if (formData.AccessEndDate && new Date(formData.ActualConnectionDate) > new Date(formData.AccessEndDate)) {
                newErrors.ActualConnectionDate = 'Фактическое подключение не может быть позже срока предоставления доступа';
            }
        }
        if (formData.ActualDisconnectionDate) {
            if (formData.AccessStartDate && new Date(formData.ActualDisconnectionDate) < new Date(formData.AccessStartDate)) {
                newErrors.ActualDisconnectionDate = 'Фактическое отключение не может быть раньше даты предоставления доступа';
            }
            if (formData.AccessEndDate && new Date(formData.ActualDisconnectionDate) > new Date(formData.AccessEndDate)) {
                newErrors.ActualDisconnectionDate = 'Фактическое отключение не может быть позже срока предоставления доступа';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleConnectionSelect = (option) => {
        setSelectedConnection(option);
        if (option && option.value) {
            const conn = externalConnections.find(c => c.Id === option.value || c.id === option.value);
            if (conn) {
                setFormData(prev => ({
                    ...prev,
                    ExternalUserName: conn.FullName || conn.fullName || '',
                    ExternalUserPosition: conn.Position || conn.position || '',
                    ExternalUserEmail: conn.Email || conn.email || '',
                    ExternalUserPhone: conn.Phone || conn.phone || '',
                    OrganizationName: conn.Organization || conn.organization || '',
                    ObjectName: conn.ObjectName || conn.objectName || '',
                    AccessStartDate: (conn.AccessStart || conn.accessStart || '').slice(0, 16),
                    AccessEndDate: (conn.AccessEnd || conn.accessEnd || '').slice(0, 16)
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await onSubmit(formData);
            setSuccess(isEditMode ? 'Запись успешно обновлена' : 'Запись успешно создана');
            setTimeout(() => navigate('/records'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || `Ошибка при ${isEditMode ? 'обновлении' : 'создании'} записи`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-5">
            <Card>
                <Card.Body>
                    <Card.Title className="text-center mb-4">
                        {isEditMode ? 'Редактировать запись доступа' : 'Создать запись доступа'}
                    </Card.Title>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    {Object.keys(errors).length > 0 && (
                        <Alert variant="danger">
                            <ul className="mb-0">
                                {Object.values(errors).map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </Alert>
                    )}

                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                        <Row align="start">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label>ФИО *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="UserFullName"
                                        value={formData.UserFullName}
                                        onChange={handleChange}
                                        required
                                        isInvalid={!!errors.UserFullName}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.UserFullName || 'Это поле обязательно'}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Должность</Form.Label>
                                    <Select
                                        name="Position"
                                        options={positions}
                                        value={positions.find(opt => opt.value === formData.Position) || null}
                                        onChange={option => setFormData(prev => ({ ...prev, Position: option ? option.value : '' }))}
                                        placeholder={positionsLoading ? 'Загрузка...' : 'Выберите должность...'}
                                        isClearable
                                        className={errors.Position ? 'is-invalid' : ''}
                                        isLoading={positionsLoading}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="Email"
                                        value={formData.Email}
                                        onChange={handleChange}
                                        isInvalid={!!errors.Email}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.Email}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Телефон</Form.Label>
                                    <PhoneInput
                                        name="Phone"
                                        value={formData.Phone}
                                        onChange={handleChange}
                                        className={"form-control" + (errors.Phone ? " is-invalid" : "")}
                                        placeholder="+375 xx xxx xx xx"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.Phone}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Объект подключения *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="ObjectName"
                                        value={formData.ObjectName}
                                        onChange={handleChange}
                                        required
                                        isInvalid={!!errors.ObjectName}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.ObjectName || 'Это поле обязательно'}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Виды выполняемых работ</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="WorkTypes"
                                        value={formData.WorkTypes}
                                        onChange={handleChange}
                                        style={{ minHeight: '80px', resize: 'vertical' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label>Выбрать подключение</Form.Label>
                                    <Select
                                        options={externalConnections.map(conn => ({
                                            value: conn.Id || conn.id,
                                            label: `${conn.Organization || conn.organization || ''} — ${conn.FullName || conn.fullName || ''}`
                                        }))}
                                        value={selectedConnection}
                                        onChange={handleConnectionSelect}
                                        placeholder="Выберите подключение..."
                                        isClearable
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Организация</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="OrganizationName"
                                        value={formData.OrganizationName}
                                        onChange={handleChange}
                                        list="organization-list"
                                        autoComplete="off"
                                        required
                                    />
                                    <datalist id="organization-list">
                                        {organizations.map(org => (
                                            <option key={org.Id} value={org.Name} />
                                        ))}
                                    </datalist>
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>ФИО стороннего пользователя</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="ExternalUserName"
                                        value={formData.ExternalUserName}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Должность внешнего пользователя</Form.Label>
                                    <Select
                                        name="ExternalUserPosition"
                                        options={positions}
                                        value={positions.find(opt => opt.value === formData.ExternalUserPosition) || null}
                                        onChange={option => setFormData(prev => ({ ...prev, ExternalUserPosition: option ? option.value : '' }))}
                                        placeholder={positionsLoading ? 'Загрузка...' : 'Выберите должность...'}
                                        isClearable
                                        className={errors.ExternalUserPosition ? 'is-invalid' : ''}
                                        isLoading={positionsLoading}
                                    />
                                    {errors.ExternalUserPosition && (
                                        <div className="invalid-feedback d-block">{errors.ExternalUserPosition}</div>
                                    )}
                                    {positionsError && <div className="text-danger small mt-1">{positionsError}</div>}
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Email стороннего пользователя</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="ExternalUserEmail"
                                        value={formData.ExternalUserEmail}
                                        onChange={handleChange}
                                        isInvalid={!!errors.ExternalUserEmail}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.ExternalUserEmail}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Телефон стороннего пользователя</Form.Label>
                                    <PhoneInput
                                        name="ExternalUserPhone"
                                        value={formData.ExternalUserPhone}
                                        onChange={handleChange}
                                        className={"form-control" + (errors.ExternalUserPhone ? " is-invalid" : "")}
                                        placeholder="+375 xx xxx xx xx"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.ExternalUserPhone}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={6}>
                                <h5 className="mb-3">Фактическое время подключения/<br />отключения дата число/месяц/год<br />время час/мин от ИС предприятия
                                </h5>

                                <Form.Group className="mb-3">
                                    <Form.Label>Дата фактического подключения</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="ActualConnectionDate"
                                        value={formData.ActualConnectionDate}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Дата фактического отключения</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="ActualDisconnectionDate"
                                        value={formData.ActualDisconnectionDate}
                                        onChange={handleChange}
                                        isInvalid={!!errors.ActualDisconnectionDate}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.ActualDisconnectionDate}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <h5 className="mb-3"> Срок предоставления доступа<br />с дата число/месяц/год<br />время час/мин по дате<br />число/месяц/год время час/мин
                                </h5>

                                <Form.Group className="mb-3">
                                    <Form.Label>Дата начала доступа *</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="AccessStartDate"
                                        value={formData.AccessStartDate}
                                        onChange={handleChange}
                                        required
                                        isInvalid={!!errors.AccessStartDate}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.AccessStartDate || 'Это поле обязательно'}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Дата окончания доступа</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        name="AccessEndDate"
                                        value={formData.AccessEndDate}
                                        onChange={handleChange}
                                        isInvalid={!!errors.AccessEndDate}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.AccessEndDate}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Тип доступа (локальный/удаленный)</Form.Label>
                                    <Form.Select
                                        name="AccessType"
                                        value={formData.AccessType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="локальный">Локальный</option>
                                        <option value="удаленный">Удаленный</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={6}>
                                <h5 className="mb-3">Ответственные лица</h5>

                                <Form.Group className="mb-3">
                                    <Form.Label>Куратор</Form.Label>
                                    <Select
                                        name="Curator"
                                        options={curators}
                                        value={curators.find(opt => opt.value === formData.Curator) || null}
                                        onChange={option => setFormData(prev => ({ ...prev, Curator: option ? option.value : '' }))}
                                        placeholder={curatorsLoading ? 'Загрузка...' : 'Выберите куратора...'}
                                        isClearable
                                        className={errors.Curator ? 'is-invalid' : ''}
                                        isLoading={curatorsLoading}
                                    />
                                    {errors.Curator && (
                                        <div className="invalid-feedback d-block">{errors.Curator}</div>
                                    )}
                                    {curatorsError && <div className="text-danger small mt-1">{curatorsError}</div>}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Исполнитель</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Executor"
                                        value={formData.Executor}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Примечания</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                name="Notes"
                                value={formData.Notes}
                                onChange={handleChange}
                                style={{ minHeight: '100px', resize: 'vertical' }}
                            />
                        </Form.Group>

                        <div className="d-grid gap-2">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={loading}
                                size="lg"
                            >
                                {loading ? (isEditMode ? 'Сохранение...' : 'Создание...') : (isEditMode ? 'Сохранить изменения' : 'Создать запись')}
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => navigate('/records')}
                                size="lg"
                            >
                                Отмена
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RecordForm; 