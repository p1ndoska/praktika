const { sql, poolPromise } = require('../config/db');

// Получить всех кураторов
exports.getCurators = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT Id, Name FROM Curators ORDER BY Name');
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении кураторов:', err);
    res.status(500).json({ error: 'Ошибка при получении кураторов', details: err.message });
  }
};

// Добавить нового куратора
exports.addCurator = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Имя куратора обязательно' });
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Name', sql.NVarChar, name.trim())
      .query('INSERT INTO Curators (Name) OUTPUT INSERTED.* VALUES (@Name)');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Ошибка при добавлении куратора:', err);
    res.status(500).json({ error: 'Ошибка при добавлении куратора', details: err.message });
  }
};

// Обновить куратора
exports.updateCurator = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Имя куратора обязательно' });
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.Int, id)
      .input('Name', sql.NVarChar, name.trim())
      .query('UPDATE Curators SET Name = @Name WHERE Id = @Id; SELECT * FROM Curators WHERE Id = @Id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Куратор не найден' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Ошибка при обновлении куратора:', err);
    res.status(500).json({ error: 'Ошибка при обновлении куратора', details: err.message });
  }
};

// Удалить куратора
exports.deleteCurator = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request().input('Id', sql.Int, id).query('DELETE FROM Curators WHERE Id = @Id');
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка при удалении куратора:', err);
    res.status(500).json({ error: 'Ошибка при удалении куратора', details: err.message });
  }
}; 