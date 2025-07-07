const { poolPromise, sql } = require('../config/db');

// Получить все организации
const getOrganizations = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT Id, Name FROM Organizations ORDER BY Name');
        res.json(result.recordset);
    } catch (error) {
        console.error('Get organizations error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Добавить организацию (только для админа)
const addOrganization = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Требуется название организации' });
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('Name', sql.NVarChar, name)
            .input('CreatedBy', sql.Int, req.user.Id)
            .query('INSERT INTO Organizations (Name, CreatedBy) VALUES (@Name, @CreatedBy)');
        res.status(201).json({ message: 'Организация добавлена' });
    } catch (error) {
        console.error('Add organization error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Удалить организацию (только для админа)
const deleteOrganization = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Id', sql.Int, id)
            .query('DELETE FROM Organizations WHERE Id = @Id');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Организация не найдена' });
        }
        res.json({ message: 'Организация удалена' });
    } catch (error) {
        console.error('Delete organization error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

module.exports = { getOrganizations, addOrganization, deleteOrganization }; 