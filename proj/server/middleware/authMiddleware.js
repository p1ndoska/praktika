const jwt = require('jsonwebtoken');
const { sql } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Не авторизован, нет токена' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const pool = await require('../config/db').poolPromise;
        const result = await pool.request()
            .input('Id', sql.Int, decoded.id)
            .query('SELECT * FROM Users WHERE Id = @Id');

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }

        req.user = result.recordset[0];
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Не авторизован, неверный токен' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.Role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Не авторизован как админимтратор' });
    }
};

module.exports = { protect, admin };