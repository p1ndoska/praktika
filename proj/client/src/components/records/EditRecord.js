import React, { useState, useEffect } from 'react';
import { Alert, Container, Spinner, Button } from 'react-bootstrap';
import recordService from '../../services/recordService';
import { useAuth } from '../../context/authContext';
import { useNavigate, useParams } from 'react-router-dom';
import RecordForm from './RecordForm';

const EditRecord = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [record, setRecord] = useState(null);

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const records = await recordService.getRecords(token);
                const foundRecord = records.find(r => r.RecordId === parseInt(id));

                if (!foundRecord) {
                    setError('Запись не найдена');
                } else {
                    setRecord(foundRecord);
                }
            } catch (err) {
                setError('Ошибка загрузки записи');
            } finally {
                setLoading(false);
            }
        };

        fetchRecord();
    }, [id, token]);

    const handleSubmit = async (formData) => {
        await recordService.updateRecord(id, formData, token);
    };

    if (user.role !== 'admin') {
        return (
            <Container className="mt-5">
                <Alert variant="danger">Недостаточно прав для редактирования записей</Alert>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
                <Button variant="secondary" onClick={() => navigate('/records')}>
                    Вернуться к списку
                </Button>
            </Container>
        );
    }

    return <RecordForm mode="edit" initialData={record} onSubmit={handleSubmit} />;
};

export default EditRecord;