import React, { useState } from 'react';
import { Alert, Container, Card, Button } from 'react-bootstrap';
import userService from '../../services/userService';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import UserForm from './UserForm';
import * as Yup from 'yup';

const CreateUser = () => {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();

    const initialValues = { username: '', email: '', password: '', role: 'user', position: '', phone: '' };

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
            username: Yup.string().required('Требуется имя пользователя').min(3, 'Имя пользователя должно содержать минимум 3 символа'),
            email: Yup.string().email('Некорректный Email').required('Требуется Email'),
            password: Yup.string()
                .required('Требуется пароль')
                .matches(passwordRegex, `Пароль не соответствует требованиям. Длина: не менее ${minLength} символов, большие и маленькие латинские буквы, цифры и символы !$#%`),
            role: Yup.string().required('Требуется роль'),
            position: Yup.string().required('Требуется выбрать должность'),
            phone: Yup.string()
                .required('Требуется номер телефона')
                .matches(/^\+375\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, 'Телефон должен быть в формате +375 xx xxx xx xx')
        });
    };

    const [validationSchema, setValidationSchema] = useState(getValidationSchema('user'));

    const handleRoleChange = (e, setFieldValue) => {
        const newRole = e.target.value;
        setFieldValue('role', newRole);
        setValidationSchema(getValidationSchema(newRole));
    };

    const handleSubmit = async (values, { resetForm, setSubmitting }) => {
        try {
            await userService.createUser(values, token);
            setSuccess('Пользователь успешно создан');
            setError('');
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка создания пользователя');
            setSuccess('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container className="mt-5">
            <div className="mb-3 text-end">
                <Button variant="secondary" onClick={() => navigate('/users')}>
                    К списку пользователей
                </Button>
            </div>
            <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Card.Body>
                    <Card.Title className="text-center mb-4">Добавление нового пользователя</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                    <UserForm
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        isEdit={false}
                        onRoleChange={handleRoleChange}
                    />
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CreateUser;