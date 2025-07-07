import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Container, Card, Button, Spinner, Form, Row, Col } from 'react-bootstrap';
import userService from '../../services/userService';
import { useAuth } from '../../context/authContext';
import * as Yup from 'yup';
import { Formik } from 'formik';
import UserInfo from './UserInfo';

const UpdateUserPage = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                setError('');
                
                const users = await userService.getUsers(token);
                const found = users.find(u => String(u.Id) === String(id));

                if (!found) {
                    setError('Пользователь не найден');
                    return;
                }

                setUser(found);
            } catch (err) {
                console.error('Fetch user error:', err);
                setError('Ошибка загрузки данных пользователя');
            } finally {
                setLoading(false);
            }
        };

        if (id && token) {
            fetchUser();
        }
    }, [id, token]);

    const validationSchema = Yup.object().shape({
        username: Yup.string()
            .required('Имя пользователя обязательно')
            .min(3, 'Имя пользователя должно содержать минимум 3 символа')
            .max(50, 'Имя пользователя не должно превышать 50 символов'),
        email: Yup.string()
            .email('Некорректный формат email')
            .required('Email обязателен')
            .max(100, 'Email не должен превышать 100 символов'),
        role: Yup.string()
            .required('Роль обязательна')
            .oneOf(['user', 'admin'], 'Неверная роль'),
        position: Yup.string()
            .required('Должность обязательна')
            .oneOf(['начальник отдела', 'работник'], 'Неверная должность'),
        phone: Yup.string()
            .required('Номер телефона обязателен')
            .matches(
                /^\+375\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/,
                'Телефон должен быть в формате +375 xx xxx xx xx'
            )
    });

    const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
        try {
            setSubmitting(true);
            setSubmitting(true);
            setError('');
            setSuccess('');

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
                // Обновляем локальное состояние пользователя
                setUser(prev => ({
                    ...prev,
                    ...values
                }));
                
                // Очищаем ошибки полей
                setFieldError('username', '');
                setFieldError('email', '');
                setFieldError('role', '');
                setFieldError('position', '');
                setFieldError('phone', '');
            } else {
                setError(response.message || 'Ошибка обновления пользователя');
            }
        } catch (err) {
            console.error('Update error:', err);
            
            // Обработка специфических ошибок валидации с сервера
            if (err.response && err.response.data && err.response.data.errors) {
                const serverErrors = err.response.data.errors;
                Object.keys(serverErrors).forEach(field => {
                    setFieldError(field, serverErrors[field]);
                });
            } else {
                setError(err.message || 'Произошла ошибка при обновлении данных');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/users');
    };

    if (loading) {
        return (
            <Container className="mt-5">
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </Spinner>
                    <p className="mt-3">Загрузка данных пользователя...</p>
                </div>
            </Container>
        );
    }

    if (error && !user) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    <Alert.Heading>Ошибка</Alert.Heading>
                    <p>{error}</p>
                </Alert>
                <Button variant="secondary" onClick={handleCancel}>
                    Вернуться к списку пользователей
                </Button>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container className="mt-5">
                <Alert variant="warning">
                    <Alert.Heading>Пользователь не найден</Alert.Heading>
                    <p>Запрашиваемый пользователь не существует или был удален.</p>
                </Alert>
                <Button variant="secondary" onClick={handleCancel}>
                    Вернуться к списку пользователей
                </Button>
            </Container>
        );
    }

    const initialValues = {
        username: user.Username || '',
        email: user.Email || '',
        role: user.Role || 'user',
        position: user.Position || '',
        phone: user.Phone || ''
    };

    return (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col lg={8} md={10}>
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">Обновление пользователя</h4>
                                <Button 
                                    variant="outline-light" 
                                    size="sm"
                                    onClick={handleCancel}
                                >
                                    <i className="fas fa-arrow-left me-1"></i>
                                    Назад
                                </Button>
                            </div>
                        </Card.Header>
                        
                        <Card.Body className="p-4">
                            {success && (
                                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                                    <i className="fas fa-check-circle me-2"></i>
                                    {success}
                                </Alert>
                            )}
                            
                            {error && (
                                <Alert variant="danger" dismissible onClose={() => setError('')}>
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {error}
                                </Alert>
                            )}

                            <UserInfo user={user} />

                            <Formik
                                initialValues={initialValues}
                                validationSchema={validationSchema}
                                onSubmit={handleSubmit}
                                enableReinitialize
                            >
                                {({ 
                                    values, 
                                    errors, 
                                    touched, 
                                    handleChange, 
                                    handleBlur, 
                                    handleSubmit, 
                                    isSubmitting,
                                    setFieldValue 
                                }) => (
                                    <Form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>
                                                        <strong>Имя пользователя *</strong>
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="username"
                                                        value={values.username}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        isInvalid={touched.username && !!errors.username}
                                                        placeholder="Введите имя пользователя"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.username}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>
                                                        <strong>Email *</strong>
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        name="email"
                                                        value={values.email}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        isInvalid={touched.email && !!errors.email}
                                                        placeholder="example@company.com"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.email}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>
                                                        <strong>Роль *</strong>
                                                    </Form.Label>
                                                    <Form.Select
                                                        name="role"
                                                        value={values.role}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        isInvalid={touched.role && !!errors.role}
                                                    >
                                                        <option value="user">Пользователь</option>
                                                        <option value="admin">Администратор</option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.role}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>
                                                        <strong>Должность *</strong>
                                                    </Form.Label>
                                                    <Form.Select
                                                        name="position"
                                                        value={values.position}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        isInvalid={touched.position && !!errors.position}
                                                    >
                                                        <option value="">Выберите должность</option>
                                                        <option value="начальник отдела">Начальник отдела</option>
                                                        <option value="работник">Работник</option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.position}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-4">
                                            <Form.Label>
                                                <strong>Номер телефона *</strong>
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="phone"
                                                value={values.phone}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                isInvalid={touched.phone && !!errors.phone}
                                                placeholder="+375 xx xxx xx xx"
                                            />
                                            <Form.Text className="text-muted">
                                                Формат: +375 xx xxx xx xx
                                            </Form.Text>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.phone}
                                            </Form.Control.Feedback>
                                        </Form.Group>

                                        <div className="d-flex justify-content-between">
                                            <Button 
                                                variant="outline-secondary" 
                                                onClick={handleCancel}
                                                disabled={isSubmitting}
                                            >
                                                Отмена
                                            </Button>
                                            
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Spinner
                                                            as="span"
                                                            animation="border"
                                                            size="sm"
                                                            role="status"
                                                            aria-hidden="true"
                                                            className="me-2"
                                                        />
                                                        Сохранение...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-save me-2"></i>
                                                        Сохранить изменения
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default UpdateUserPage;