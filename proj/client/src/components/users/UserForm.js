import React, { useEffect, useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Formik } from 'formik';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import positionService from '../../services/positionService';

const UserForm = ({ initialValues, validationSchema, onSubmit, isEdit, onRoleChange }) => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPositions = async () => {
            setLoading(true);
            setError('');
            try {
                // Токен можно пробросить через props или context, если нужно
                const token = localStorage.getItem('token');
                const data = await positionService.getPositions(token);
                setPositions(data.map(p => ({ value: p.Name, label: p.Name })));
            } catch (e) {
                setError('Ошибка при загрузке должностей');
            } finally {
                setLoading(false);
            }
        };
        fetchPositions();
    }, []);

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ handleSubmit, handleChange, setFieldValue, values, errors, touched, isSubmitting }) => (
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Имя пользователя</Form.Label>
                        <Form.Control
                            type="text"
                            name="username"
                            value={values.username}
                            onChange={handleChange}
                            isInvalid={touched.username && !!errors.username}
                            disabled={isEdit}
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
                    {!isEdit && (
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
                    )}
                    <Form.Group className="mb-3">
                        <Form.Label>Роль</Form.Label>
                        <Form.Select
                            name="role"
                            value={values.role}
                            onChange={e => {
                                handleChange(e);
                                if (onRoleChange) onRoleChange(e, setFieldValue);
                            }}
                            isInvalid={touched.role && !!errors.role}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.role}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Должность</Form.Label>
                        <CreatableSelect
                            name="position"
                            options={positions}
                            value={positions.find(opt => opt.value === values.position) || (values.position ? { value: values.position, label: values.position } : null)}
                            onChange={option => setFieldValue('position', option ? option.value : '')}
                            placeholder={loading ? 'Загрузка...' : 'Выберите или введите должность...'}
                            isClearable
                            className={touched.position && errors.position ? 'is-invalid' : ''}
                            isLoading={loading}
                        />
                        {touched.position && errors.position && (
                            <div className="invalid-feedback d-block">{errors.position}</div>
                        )}
                        {error && <div className="text-danger small mt-1">{error}</div>}
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Телефон</Form.Label>
                        <PhoneInput
                            name="phone"
                            value={values.phone}
                            onChange={handleChange}
                            className={touched.phone && errors.phone ? 'form-control is-invalid' : 'form-control'}
                            placeholder="+375 xx xxx xx xx"
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.phone}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Button variant="primary" type="submit" disabled={isSubmitting} className="w-100">
                        {isSubmitting ? (isEdit ? 'Сохранение...' : 'Добавление...') : (isEdit ? 'Сохранить' : 'Добавить')}
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

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

export default UserForm; 