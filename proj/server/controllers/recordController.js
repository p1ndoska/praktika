const { poolPromise, sql } = require('../config/db');

// Получить все записи
const getRecords = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT
                    RecordId,
                    -- Данные внутреннего пользователя
                    UserFullName, Position, Email, Phone,
                    -- Данные стороннего пользователя
                    OrganizationName, ExternalUserName, ExternalUserPosition, ExternalUserEmail, ExternalUserPhone,
                    -- Данные о подключении
                    ObjectName, WorkTypes, AccessType,
                    -- Сроки доступа
                    AccessStartDate, AccessEndDate,
                    -- Фактические даты
                    ActualConnectionDate, ActualDisconnectionDate,
                    -- Ответственные
                    Curator, Executor,
                    -- Примечания
                    Notes
                FROM Records
                ORDER BY AccessStartDate DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Get records error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Создать запись
const createRecord = async (req, res) => {
    const {
        // Данные внутреннего пользователя
        UserFullName, Position, Email, Phone,
        // Данные стороннего пользователя
        OrganizationName, ExternalUserName, ExternalUserPosition, ExternalUserEmail, ExternalUserPhone,
        // Данные о подключении
        ObjectName, WorkTypes, AccessType,
        // Сроки доступа
        AccessStartDate, AccessEndDate,
        // Фактические даты
        ActualConnectionDate, ActualDisconnectionDate,
        // Ответственные
        Curator, Executor,
        // Примечания
        Notes
    } = req.body;

    // Валидация обязательных полей
    if (!UserFullName || !ObjectName || !AccessType || !AccessStartDate) {
        return res.status(400).json({
            message: 'Заполните обязательные поля: ФИО, Объект, Тип доступа, Дата начала'
        });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            // Данные внутреннего пользователя
            .input('UserFullName', sql.NVarChar(255), UserFullName)
            .input('Position', sql.NVarChar(255), Position || null)
            .input('Email', sql.NVarChar(255), Email || null)
            .input('Phone', sql.NVarChar(20), Phone || null)
            // Данные стороннего пользователя
            .input('OrganizationName', sql.NVarChar(255), OrganizationName || null)
            .input('ExternalUserName', sql.NVarChar(255), ExternalUserName || null)
            .input('ExternalUserPosition', sql.NVarChar(255), ExternalUserPosition || null)
            .input('ExternalUserEmail', sql.NVarChar(255), ExternalUserEmail || null)
            .input('ExternalUserPhone', sql.NVarChar(20), ExternalUserPhone || null)
            // Данные о подключении
            .input('ObjectName', sql.NVarChar(255), ObjectName)
            .input('WorkTypes', sql.NVarChar(sql.MAX), WorkTypes || null)
            .input('AccessType', sql.NVarChar(50), AccessType)
            // Сроки доступа
            .input('AccessStartDate', sql.DateTime, AccessStartDate)
            .input('AccessEndDate', sql.DateTime, AccessEndDate || null)
            // Фактические даты
            .input('ActualConnectionDate', sql.DateTime, ActualConnectionDate || null)
            .input('ActualDisconnectionDate', sql.DateTime, ActualDisconnectionDate || null)
            // Ответственные
            .input('Curator', sql.NVarChar(255), Curator || null)
            .input('Executor', sql.NVarChar(255), Executor || null)
            // Примечания
            .input('Notes', sql.NVarChar(sql.MAX), Notes || null)
            .query(`
                INSERT INTO Records (
                    UserFullName, Position, Email, Phone,
                    OrganizationName, ExternalUserName, ExternalUserPosition, ExternalUserEmail, ExternalUserPhone,
                    ObjectName, WorkTypes, AccessType,
                    AccessStartDate, AccessEndDate,
                    ActualConnectionDate, ActualDisconnectionDate,
                    Curator, Executor,
                    Notes
                ) VALUES (
                    @UserFullName, @Position, @Email, @Phone,
                    @OrganizationName, @ExternalUserName, @ExternalUserPosition, @ExternalUserEmail, @ExternalUserPhone,
                    @ObjectName, @WorkTypes, @AccessType,
                    @AccessStartDate, @AccessEndDate,
                    @ActualConnectionDate, @ActualDisconnectionDate,
                    @Curator, @Executor,
                    @Notes
                )
            `);

        res.status(201).json({ message: 'Запись успешно создана' });
    } catch (error) {
        console.error('Create record error:', error);
        res.status(500).json({
            message: 'Ошибка при создании записи',
            error: error.message
        });
    }
};

// Обновить запись
const updateRecord = async (req, res) => {
    const { id } = req.params;
    const {
        // Данные внутреннего пользователя
        UserFullName, Position, Email, Phone,
        // Данные стороннего пользователя
        OrganizationName, ExternalUserName, ExternalUserPosition, ExternalUserEmail, ExternalUserPhone,
        // Данные о подключении
        ObjectName, WorkTypes, AccessType,
        // Сроки доступа
        AccessStartDate, AccessEndDate,
        // Фактические даты
        ActualConnectionDate, ActualDisconnectionDate,
        // Ответственные
        Curator, Executor,
        // Примечания
        Notes
    } = req.body;

    try {
        const pool = await poolPromise;

        // Проверка существования записи
        const recordExists = await pool.request()
            .input('RecordId', sql.Int, id)
            .query('SELECT 1 FROM Records WHERE RecordId = @RecordId');

        if (recordExists.recordset.length === 0) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }

        // Обновление записи
        await pool.request()
            .input('RecordId', sql.Int, id)
            // Данные внутреннего пользователя
            .input('UserFullName', sql.NVarChar(255), UserFullName)
            .input('Position', sql.NVarChar(255), Position || null)
            .input('Email', sql.NVarChar(255), Email || null)
            .input('Phone', sql.NVarChar(20), Phone || null)
            // Данные стороннего пользователя
            .input('OrganizationName', sql.NVarChar(255), OrganizationName || null)
            .input('ExternalUserName', sql.NVarChar(255), ExternalUserName || null)
            .input('ExternalUserPosition', sql.NVarChar(255), ExternalUserPosition || null)
            .input('ExternalUserEmail', sql.NVarChar(255), ExternalUserEmail || null)
            .input('ExternalUserPhone', sql.NVarChar(20), ExternalUserPhone || null)
            // Данные о подключении
            .input('ObjectName', sql.NVarChar(255), ObjectName)
            .input('WorkTypes', sql.NVarChar(sql.MAX), WorkTypes || null)
            .input('AccessType', sql.NVarChar(50), AccessType)
            // Сроки доступа
            .input('AccessStartDate', sql.DateTime, AccessStartDate)
            .input('AccessEndDate', sql.DateTime, AccessEndDate || null)
            // Фактические даты
            .input('ActualConnectionDate', sql.DateTime, ActualConnectionDate || null)
            .input('ActualDisconnectionDate', sql.DateTime, ActualDisconnectionDate || null)
            // Ответственные
            .input('Curator', sql.NVarChar(255), Curator || null)
            .input('Executor', sql.NVarChar(255), Executor || null)
            // Примечания
            .input('Notes', sql.NVarChar(sql.MAX), Notes || null)
            .query(`
                UPDATE Records SET
                    UserFullName = @UserFullName,
                    Position = @Position,
                    Email = @Email,
                    Phone = @Phone,
                    OrganizationName = @OrganizationName,
                    ExternalUserName = @ExternalUserName,
                    ExternalUserPosition = @ExternalUserPosition,
                    ExternalUserEmail = @ExternalUserEmail,
                    ExternalUserPhone = @ExternalUserPhone,
                    ObjectName = @ObjectName,
                    WorkTypes = @WorkTypes,
                    AccessType = @AccessType,
                    AccessStartDate = @AccessStartDate,
                    AccessEndDate = @AccessEndDate,
                    ActualConnectionDate = @ActualConnectionDate,
                    ActualDisconnectionDate = @ActualDisconnectionDate,
                    Curator = @Curator,
                    Executor = @Executor,
                    Notes = @Notes
                WHERE RecordId = @RecordId
            `);

        res.json({ message: 'Запись успешно обновлена' });
    } catch (error) {
        console.error('Update record error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Удалить запись
const deleteRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;

        // Проверка существования записи
        const recordExists = await pool.request()
            .input('RecordId', sql.Int, id)
            .query('SELECT 1 FROM Records WHERE RecordId = @RecordId');

        if (recordExists.recordset.length === 0) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }

        await pool.request()
            .input('RecordId', sql.Int, id)
            .query('DELETE FROM Records WHERE RecordId = @RecordId');

        res.json({ message: 'Запись успешно удалена' });
    } catch (error) {
        console.error('Delete record error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

module.exports = { getRecords, createRecord, updateRecord, deleteRecord };