const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');
const { admin } = require('../middleware/authMiddleware');
const { addExternalConnection } = require('./externalConnectionController');

// Константы для кодов ошибок
const HTTP_UNAUTHORIZED = 401;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_ERROR = 500;

// Время экспирации токена (можно вынести в .env)
const TOKEN_EXPIRES_IN = '1h';

const login = async (req, res) => {
    const { username, password } = req.body;

    // Валидация входных данных
    if (!username || !password) {
        return res.status(HTTP_BAD_REQUEST).json({
            message: 'Введите имя и пароль'
        });
    }

    try {
        const pool = await poolPromise;

        // Безопасный запрос с параметризацией
        const result = await pool.request()
            .input('Username', sql.NVarChar(50), username)
            .query('SELECT Id, Username, Password, Email, Role, FirstLogin, IsActive, LastPasswordChange, Position, Phone FROM Users WHERE Username = @Username');

        if (result.recordset.length === 0) {
            return res.status(HTTP_UNAUTHORIZED).json({
                message: 'Некорректные данные'
            });
        }

        const user = result.recordset[0];

        if (!user.IsActive) {
            return res.status(HTTP_UNAUTHORIZED).json({
                message: 'Учетная запись пользователя отключена'
            });
        }

        // Проверка срока действия пароля
        let mustChangePassword = false;
        if (user.LastPasswordChange) {
            const lastChange = new Date(user.LastPasswordChange);
            const now = new Date();
            const diffDays = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
            if ((user.Role === 'admin' && diffDays >= 180) || (user.Role !== 'admin' && diffDays >= 365)) {
                mustChangePassword = true;
            }
        } else {
            mustChangePassword = true;
        }

        // Сравнение паролей
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.status(HTTP_UNAUTHORIZED).json({
                message: 'Некорректные данные'
            });
        }

        // Генерация JWT токена
        const token = jwt.sign(
            {
                id: user.Id,
                role: user.Role,
                username: user.Username,
                firstLogin: user.FirstLogin
            },
            process.env.JWT_SECRET,
            { expiresIn: TOKEN_EXPIRES_IN }
        );

        // Ответ без чувствительных данныхпр
        res.json({
            token,
            user: {
                id: user.Id,
                username: user.Username,
                email: user.Email,
                role: user.Role,
                firstLogin: user.FirstLogin,
                mustChangePassword,
                lastPasswordChange: user.LastPasswordChange,
                position: user.Position,
                phone: user.Phone
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(HTTP_INTERNAL_ERROR).json({
            message: 'Internal server error'
        });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.Id;

    // Валидация паролей
    if (!currentPassword || !newPassword) {
        return res.status(HTTP_BAD_REQUEST).json({
            message: '\n' + 'Требуется текущий и новый пароль.'
        });
    }

    if (currentPassword === newPassword) {
        return res.status(HTTP_BAD_REQUEST).json({
            message: 'Новый пароль должен отличаться от старого'
        });
    }

    try {
        const pool = await poolPromise;

        // Получаем пользователя
        const userResult = await pool.request()
            .input('Id', sql.Int, userId)
            .query('SELECT Id, Password, Role FROM Users WHERE Id = @Id');

        if (userResult.recordset.length === 0) {
            return res.status(HTTP_NOT_FOUND).json({
                message: 'Пользователь не найден'
            });
        }

        const user = userResult.recordset[0];

        // Проверка текущего пароля
        const isMatch = await bcrypt.compare(currentPassword, user.Password);
        if (!isMatch) {
            return res.status(HTTP_BAD_REQUEST).json({
                message: 'Текущий пароль неверный'
            });
        }

        // Получаем роль пользователя
        const userResultRole = await pool.request()
            .input('Id', sql.Int, userId)
            .query('SELECT Id, Password, Role FROM Users WHERE Id = @Id');
        if (userResultRole.recordset.length === 0) {
            return res.status(HTTP_NOT_FOUND).json({
                message: 'Пользователь не найден'
            });
        }
        const userRole = userResultRole.recordset[0];

        // Валидация нового пароля по роли
        let passwordRegex, minLength;
        if (userRole.Role === 'admin') {
            passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!$#%])[A-Za-z\d!$#%]{14,}$/;
            minLength = 14;
        } else {
            passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!$#%])[A-Za-z\d!$#%]{9,}$/;
            minLength = 9;
        }
        if (!passwordRegex.test(newPassword)) {
            return res.status(HTTP_BAD_REQUEST).json({
                message: `Пароль не соответствует требованиям. Длина: не менее ${minLength} символов, большие и маленькие латинские буквы, цифры и символы !$#%` 
            });
        }

        // Хеширование нового пароля
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Обновление пароля в БД
        await pool.request()
            .input('Id', sql.Int, userId)
            .input('Password', sql.NVarChar(255), hashedPassword)
            .input('FirstLogin', sql.Bit, 0)
            .query(`
                UPDATE Users 
                SET Password = @Password, 
                    FirstLogin = @FirstLogin, 
                    LastPasswordChange = GETDATE() 
                WHERE Id = @Id
            `);

        res.json({
            message: 'Пароль успешно изменен'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(HTTP_INTERNAL_ERROR).json({
            message: 'Internal server error'
        });
    }
};

// @desc    Get current user by token
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const pool = await poolPromise;
        const userResult = await pool.request()
            .input('Id', sql.Int, req.user.Id)
            .query('SELECT Id, Username, Email, Role, FirstLogin, IsActive, Position, Phone, LastPasswordChange FROM Users WHERE Id = @Id');
        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        const user = userResult.recordset[0];
        res.json({
            id: user.Id,
            username: user.Username,
            email: user.Email,
            role: user.Role,
            firstLogin: user.FirstLogin,
            isActive: user.IsActive,
            position: user.Position,
            phone: user.Phone,
            lastPasswordChange: user.LastPasswordChange
        });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    login,
    changePassword,
    getMe
};