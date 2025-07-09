import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Row, Col } from 'react-bootstrap';
import recordService from '../../services/recordService';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import positionService from '../../services/positionService';
import API_BASE_URL from '../../apiConfig';

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

const CreateRecord = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [validated, setValidated] = useState(false);
    const [errors, setErrors] = useState({});
    const [organizations, setOrganizations] = useState([]);
    const [externalConnections, setExternalConnections] = useState([]);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [positions, setPositions] = useState([]);
    const [positionsLoading, setPositionsLoading] = useState(false);
    const [positionsError, setPositionsError] = useState('');

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

    useEffect(() => {
        if (user) {
            console.log('user:', user);
            setFormData(prev => ({
                ...prev,
                UserFullName: user.username || '',
                Position: user.position || user.Position || '',
                Email: user.email || '',
                Phone: user.phone || user.Phone || ''
            }));
        }
    }, [user]);

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

        // Получаем список внешних подключений
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
    }, [token]);

    useEffect(() => {
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
            await recordService.createRecord(formData, token);
            setSuccess('Запись успешно создана');
            setTimeout(() => navigate('/records'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при создании записи');
        } finally {
            setLoading(false);
        }
    };

    // Добавить обработчик выбора подключения
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
                    AccessStartDate: (conn.AccessStart || conn.accessStart || '').slice(0, 16),
                    AccessEndDate: (conn.AccessEnd || conn.accessEnd || '').slice(0, 16)
                }));
            }
        }
    };

    return (
        <Container className="mt-5">
            <Card>
                <Card.Body>
                    <Card.Title className="text-center mb-4">Создать запись доступа</Card.Title>

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
                                        rows={2}
                                        name="WorkTypes"
                                        value={formData.WorkTypes}
                                        onChange={handleChange}
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
                                    <Form.Control
                                        type="text"
                                        name="Curator"
                                        value={formData.Curator}
                                        onChange={handleChange}
                                    />
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
                                rows={3}
                                name="Notes"
                                value={formData.Notes}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <div className="d-grid gap-2">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={loading}
                                size="lg"
                            >
                                {loading ? 'Создание...' : 'Создать запись'}
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

export default CreateRecord;