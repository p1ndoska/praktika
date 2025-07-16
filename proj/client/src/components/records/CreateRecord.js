import React from 'react';
import recordService from '../../services/recordService';
import { useAuth } from '../../context/authContext';
import RecordForm from './RecordForm';

const CreateRecord = () => {
    const { token } = useAuth();

    const handleSubmit = async (formData) => {
        await recordService.createRecord(formData, token);
    };

    return <RecordForm mode="create" onSubmit={handleSubmit} />;
};

export default CreateRecord;