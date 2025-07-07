import React, { useState } from 'react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import authService from '../../services/authService';
import { useAuth } from '../../context/authContext';

const Login = () => {
    const [error, setError] = useState('');
    const { login } = useAuth();

    const validationSchema = Yup.object().shape({
        username: Yup.string().required('Username is required'),
        password: Yup.string().required('Password is required')
    });

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const userData = await authService.login(values.username, values.password);
            login(userData);
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <Container className="mt-5">
            <Card style={{ maxWidth: '500px', margin: '0 auto' }}>
                <Card.Body>
                    <Card.Title className="text-center mb-4">Вход</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Formik
                        initialValues={{ username: '', password: '' }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ handleSubmit, handleChange, values, errors, touched, isSubmitting }) => (
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Имя пользователя</Form.Label>
                                    <Form.Control
                                        type="text"
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
                                    <Form.Label>Пароль</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={values.password}
                                        onChange={handleChange}
                                        isInvalid={touched.password && !!errors.password}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-100"
                                >
                                    {isSubmitting ? 'Вход...' : 'Войти'}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Login;