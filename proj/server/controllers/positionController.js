const { sql, poolPromise } = require('../config/db');

// Получить все должности
exports.getPositions = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT Id, Name FROM Positions ORDER BY Name');
    res.json(result.recordset);
  } catch (err) {
    console.error('Ошибка при получении должностей:', err);
    res.status(500).json({ error: 'Ошибка при получении должностей', details: err.message });
  }
};

// Добавить новую должность
exports.addPosition = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название должности обязательно' });
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Name', sql.NVarChar, name.trim())
      .query('INSERT INTO Positions (Name) OUTPUT INSERTED.* VALUES (@Name)');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Ошибка при добавлении должности:', err);
    res.status(500).json({ error: 'Ошибка при добавлении должности', details: err.message });
  }
};

// Обновить должность
exports.updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название должности обязательно' });
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.Int, id)
      .input('Name', sql.NVarChar, name.trim())
      .query('UPDATE Positions SET Name = @Name WHERE Id = @Id; SELECT * FROM Positions WHERE Id = @Id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Должность не найдена' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Ошибка при обновлении должности:', err);
    res.status(500).json({ error: 'Ошибка при обновлении должности', details: err.message });
  }
};

// Удалить должность
exports.deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request().input('Id', sql.Int, id).query('DELETE FROM Positions WHERE Id = @Id');
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка при удалении должности:', err);
    res.status(500).json({ error: 'Ошибка при удалении должности', details: err.message });
  }
}; 