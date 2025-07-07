import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Container, Card, Button, Spinner, Form } from 'react-bootstrap';
import userService from '../../services/userService';
import { useAuth } from '../../context/authContext';
import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';
import positionService from '../../services/positionService';
import CreatableSelect from 'react-select/creatable';

const EditUser = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [initialValues, setInitialValues] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [positions, setPositions] = useState([]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const users = await userService.getUsers(token);
                const found = users.find(u => String(u.Id) === String(id));

                if (!found) {
                    setError('Пользователь не найден');
                    return;
                }

                setInitialValues({
                    username: found.Username,
                    email: found.Email,
                    role: found.Role,
                    position: found.Position || '',
                    phone: found.Phone || ''
                });
            } catch (err) {
                setError('Ошибка загрузки пользователя');
                console.error('Fetch user error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
        // Загружаем должности
        const fetchPositions = async () => {
            try {
                const data = await positionService.getPositions(token);
                setPositions(data);
            } catch (e) {
                setPositions([]);
            }
        };
        fetchPositions();
    }, [id, token]);

    const validationSchema = Yup.object().shape({
        username: Yup.string()
            .required('Требуется имя пользователя')
            .min(3, 'Имя пользователя должно содержать минимум 3 символа'),
        email: Yup.string()
            .email('Некорректный Email')
            .required('Требуется Email'),
        role: Yup.string()
            .required('Требуется роль'),
        position: Yup.string().required('Требуется выбрать должность'),
        phone: Yup.string()
            .required('Требуется номер телефона')
            .matches(/^\+375\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, 'Телефон должен быть в формате +375 xx xxx xx xx')
    });

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const response = await userService.updateUser(
                id,
                {
                    username: values.username,
                    email: values.email,
                    role: values.role,
                    position: values.position,
                    phone: values.phone
                },
                token
            );

            if (response.success) {
                setSuccess('Данные пользователя успешно обновлены');
                setError('');
                setInitialValues(values);
            } else {
                setError(response.message || 'Ошибка обновления пользователя');
            }
        } catch (err) {
            setError(err.message || 'Ошибка при обновлении данных');
            console.error('Update error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error && !initialValues) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
                <Button variant="secondary" onClick={() => navigate('/users')}>
                    Вернуться к списку пользователей
                </Button>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Редактирование пользователя</h2>
                <Button variant="outline-secondary" onClick={() => navigate('/users')}>
                    Назад к списку
                </Button>
            </div>

            <Card>
                <Card.Body>
                    {success && <Alert variant="success">{success}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Formik
                        enableReinitialize
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ handleSubmit, handleChange, values, errors, touched, isSubmitting }) => (
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Имя пользователя</Form.Label>
                                    <Form.Control
                                        name="username"
                                        value={values.username}
                                        onChange={handleChange}
                                        isInvalid={touched.username && !!errors.username}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.username}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={values.email}
                                        onChange={handleChange}
                                        isInvalid={touched.email && !!errors.email}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Роль</Form.Label>
                                    <Form.Select
                                        name="role"
                                        value={values.role}
                                        onChange={handleChange}
                                        isInvalid={touched.role && !!errors.role}
                                    >
                                        <option value="user">Пользователь</option>
                                        <option value="admin">Администратор</option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.role}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Должность</Form.Label>
                                    <CreatableSelect
                                        name="position"
                                        options={positions.map(pos => ({ value: pos.Name, label: pos.Name }))}
                                        value={positions.find(pos => pos.Name === values.position) ? { value: values.position, label: values.position } : (values.position ? { value: values.position, label: values.position } : null)}
                                        onChange={option => handleChange({ target: { name: 'position', value: option ? option.value : '' } })}
                                        placeholder={positions.length === 0 ? 'Загрузка...' : 'Выберите или введите должность...'}
                                        isClearable
                                        className={touched.position && errors.position ? 'is-invalid' : ''}
                                        isLoading={positions.length === 0}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.position}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Телефон</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="phone"
                                        value={values.phone}
                                        onChange={handleChange}
                                        isInvalid={touched.phone && !!errors.phone}
                                        placeholder="+375 xx xxx xx xx"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.phone}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <div className="d-grid">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EditUser;