import React, { useState } from 'react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import authService from '../../services/authService';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { token, user, login } = useAuth();
    const navigate = useNavigate();

    // Динамическая схема валидации пароля по роли
    const getValidationSchema = (role) => {
        let passwordRegex, minLength;
        if (role === 'admin') {
            passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!$#%])[A-Za-z\d!$#%]{14,}$/;
            minLength = 14;
        } else {
            passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!$#%])[A-Za-z\d!$#%]{9,}$/;
            minLength = 9;
        }
        return Yup.object().shape({
            currentPassword: Yup.string().required('Требуется текущий пароль'),
            newPassword: Yup.string()
                .required('Требуется новый пароль')
                .matches(passwordRegex, `Пароль не соответствует требованиям. Длина: не менее ${minLength} символов, большие и маленькие латинские буквы, цифры и символы !$#%`),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword'), null], 'Пароли должны совпадать')
                .required('Требуется подтверждение пароля')
        });
    };

    const validationSchema = getValidationSchema(user?.role);

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            await authService.changePassword(
                values.currentPassword,
                values.newPassword,
                token
            );
            setSuccess('Пароль успешно изменен');
            setError('');
            const userData = await authService.login(user.username, values.newPassword);
            login(userData);
        } catch (err) {
            setError(err.message);
            setSuccess('');
            setSubmitting(false);
        }
    };

    return (
        <Container className="mt-5">
            <Card style={{ maxWidth: '500px', margin: '0 auto' }}>
                <Card.Body>
                    <Card.Title className="text-center mb-4">Изменение пароля</Card.Title>
                    <Card.Text className="text-center text-danger mb-4">
                        Вы должны сменить пароль прежде чем продолжить.
                    </Card.Text>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                    <Formik
                        initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ handleSubmit, handleChange, values, errors, touched, isSubmitting }) => (
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Текущий пароль</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="currentPassword"
                                        value={values.currentPassword}
                                        onChange={handleChange}
                                        isInvalid={touched.currentPassword && !!errors.currentPassword}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.currentPassword}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Новый пароль</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="newPassword"
                                        value={values.newPassword}
                                        onChange={handleChange}
                                        isInvalid={touched.newPassword && !!errors.newPassword}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.newPassword}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Подтвердите новый пароль</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="confirmPassword"
                                        value={values.confirmPassword}
                                        onChange={handleChange}
                                        isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.confirmPassword}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-100"
                                >
                                    {isSubmitting ? 'Изменение...' : 'Изменить пароль'}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ChangePassword;