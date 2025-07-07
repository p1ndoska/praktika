const { poolPromise, sql } = require('../config/db');

const addExternalConnection = async (req, res) => {
    const { organizationId, fullName, position, email, phone, accessStart, accessEnd } = req.body;

    if (!organizationId || !fullName || !accessStart) {
        return res.status(400).json({ message: 'Обязательные поля не заполнены' });
    }

    try {
        const pool = await poolPromise;
        const orgResult = await pool.request()
            .input('Id', sql.Int, organizationId)
            .query('SELECT Name FROM Organizations WHERE Id = @Id');
        if (orgResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Организация не найдена' });
        }
        const organizationName = orgResult.recordset[0].Name;

        await pool.request()
            .input('Organization', sql.NVarChar(255), organizationName)
            .input('FullName', sql.NVarChar(255), fullName)
            .input('Position', sql.NVarChar(255), position)
            .input('Email', sql.NVarChar(255), email)
            .input('Phone', sql.NVarChar(50), phone)
            .input('AccessStart', sql.DateTime, accessStart)
            .input('AccessEnd', sql.DateTime, accessEnd)
            .query(`
                INSERT INTO ExternalConnections (Organization, FullName, Position, Email, Phone, AccessStart, AccessEnd)
                VALUES (@Organization, @FullName, @Position, @Email, @Phone, @AccessStart, @AccessEnd)
            `);

        res.json({ message: 'Подключение успешно добавлено' });
    } catch (error) {
        console.error('Add external connection error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

const getExternalConnections = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try {
        const pool = await poolPromise;
        // Удаляем просроченные подключения
        await pool.request().query('DELETE FROM ExternalConnections WHERE AccessEnd IS NOT NULL AND AccessEnd < GETDATE()');
        // Получаем актуальные подключения
        const result = await pool.request()
            .query(`SELECT * FROM ExternalConnections ORDER BY AccessStart DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`);
        const totalResult = await pool.request().query('SELECT COUNT(*) as count FROM ExternalConnections');
        res.json({ data: result.recordset, total: totalResult.recordset[0].count });
    } catch (error) {
        console.error('Get external connections error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

const deleteExternalConnection = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('Id', sql.Int, id)
            .query('DELETE FROM ExternalConnections WHERE Id = @Id');
        res.json({ message: 'Подключение удалено' });
    } catch (error) {
        console.error('Delete external connection error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

const updateExternalConnection = async (req, res) => {
    const { id } = req.params;
    const { organizationId, fullName, position, email, phone, accessStart, accessEnd } = req.body;

    if (!id || !organizationId || !fullName || !accessStart) {
        return res.status(400).json({ message: 'Обязательные поля не заполнены (id, organizationId, fullName, accessStart)' });
    }

    try {
        const pool = await poolPromise;

        // Получаем название организации
        const orgResult = await pool.request()
            .input('Id', sql.Int, organizationId)
            .query('SELECT Name FROM Organizations WHERE Id = @Id');

        if (orgResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Организация не найдена' });
        }

        const organizationName = orgResult.recordset[0].Name;

        // Обновляем запись
        const updateQuery = `
            UPDATE ExternalConnections SET
                Organization = @Organization,
                FullName = @FullName,
                Position = @Position,
                Email = @Email,
                Phone = @Phone,
                AccessStart = @AccessStart,
                AccessEnd = @AccessEnd
            WHERE Id = @Id
        `;

        const result = await pool.request()
            .input('Id', sql.Int, id)
            .input('Organization', sql.NVarChar(255), organizationName)
            .input('FullName', sql.NVarChar(255), fullName)
            .input('Position', sql.NVarChar(255), position || null)
            .input('Email', sql.NVarChar(255), email || null)
            .input('Phone', sql.NVarChar(50), phone || null)
            .input('AccessStart', sql.DateTime, accessStart)
            .input('AccessEnd', sql.DateTime, accessEnd || null)
            .query(updateQuery);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Подключение не найдено' });
        }

        res.json({
            message: 'Подключение успешно обновлено',
            updatedId: id
        });
    } catch (error) {
        console.error('Update external connection error:', error);
        res.status(500).json({
            message: 'Ошибка сервера при обновлении подключения',
            error: error.message
        });
    }
};

module.exports = {
    addExternalConnection,
    getExternalConnections,
    deleteExternalConnection,
    updateExternalConnection
}; 