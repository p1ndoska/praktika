const bcrypt = require('bcryptjs');
const { poolPromise, sql } = require('../config/db');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT Id, Username, Email, Role, FirstLogin, IsActive, Position, Phone FROM Users');
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
    const { username, email, password, role, position, phone } = req.body;

    // Валидация пароля по роли
    let passwordRegex, minLength;
    if (role === 'admin') {
        passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!$#%])[A-Za-z\d!$#%]{14,}$/;
        minLength = 14;
    } else {
        passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!$#%])[A-Za-z\d!$#%]{9,}$/;
        minLength = 9;
    }
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: `Пароль не соответствует требованиям. Длина: не менее ${minLength} символов, большие и маленькие латинские буквы, цифры и символы !$#%` 
        });
    }

    try {
        const pool = await poolPromise;

        // Динамическая проверка должности
        if (position !== undefined) {
            const posResult = await pool.request()
                .input('Name', sql.NVarChar, position)
                .query('SELECT 1 FROM Positions WHERE LOWER(Name) = LOWER(@Name)');
            if (posResult.recordset.length === 0) {
                return res.status(400).json({ message: 'Должность не найдена в справочнике' });
            }
        }

        // Check if user exists
        const userExists = await pool.request()
            .input('Username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE Username = @Username');

        if (userExists.recordset.length > 0) {
            return res.status(400).json({ message: 'Имя пользователя уже существует' });
        }

        // Check if email exists
        const emailExists = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        if (emailExists.recordset.length > 0) {
            return res.status(400).json({ message: 'Email уже существует' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        await pool.request()
            .input('Username', sql.NVarChar, username)
            .input('Email', sql.NVarChar, email)
            .input('Password', sql.NVarChar, hashedPassword)
            .input('Role', sql.NVarChar, role || 'user')
            .input('Position', sql.NVarChar, position)
            .input('Phone', sql.NVarChar, phone)
            .input('LastPasswordChange', sql.DateTime, new Date())
            .query('INSERT INTO Users (Username, Email, Password, Role, Position, Phone, LastPasswordChange) VALUES (@Username, @Email, @Password, @Role, @Position, @Phone, @LastPasswordChange)');

        res.status(201).json({ message: 'Пользователь создан успешно' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, role, position, phone } = req.body;

    if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'Неверный ID пользователя' });
    }

    // Валидация входных данных
    const errors = {};
    
    if (username !== undefined) {
        if (!username || username.trim().length < 3) {
            errors.username = 'Имя пользователя должно содержать минимум 3 символа';
        } else if (username.trim().length > 50) {
            errors.username = 'Имя пользователя не должно превышать 50 символов';
        }
    }
    
    if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            errors.email = 'Некорректный формат email';
        } else if (email.length > 100) {
            errors.email = 'Email не должен превышать 100 символов';
        }
    }
    
    if (role !== undefined && !['user', 'admin'].includes(role)) {
        errors.role = 'Неверная роль пользователя';
    }
    
    // Динамическая проверка должности
    if (position !== undefined) {
        const pool = await poolPromise;
        const posResult = await pool.request()
            .input('Name', sql.NVarChar, position)
            .query('SELECT 1 FROM Positions WHERE LOWER(Name) = LOWER(@Name)');
        if (posResult.recordset.length === 0) {
            errors.position = 'Должность не найдена в справочнике';
        }
    }
    
    if (phone !== undefined) {
        const phoneRegex = /^\+375\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
        if (!phone || !phoneRegex.test(phone)) {
            errors.phone = 'Телефон должен быть в формате +375 xx xxx xx xx';
        }
    }
    
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ 
            success: false,
            message: 'Ошибки валидации',
            errors 
        });
    }

    try {
        const pool = await poolPromise;

        // Получаем текущие данные пользователя
        const currentUserResult = await pool.request()
            .input('Id', sql.Int, id)
            .query('SELECT Username, Email, Role FROM Users WHERE Id = @Id');

        if (currentUserResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const currentUser = currentUserResult.recordset[0];
        const updates = {};
        const errors = {};

        // Обновление username (если предоставлено и отличается от текущего)
        if (username !== undefined && username !== currentUser.Username) {
            // Проверка уникальности username
            const userExists = await pool.request()
                .input('Username', sql.NVarChar, username)
                .input('Id', sql.Int, id)
                .query('SELECT 1 FROM Users WHERE Username = @Username AND Id <> @Id');

            if (userExists.recordset.length > 0) {
                errors.username = 'Имя пользователя уже занято';
            } else {
                updates.Username = username;
            }
        }

        // Обновление email (если предоставлено и отличается от текущего)
        if (email !== undefined && email !== currentUser.Email) {
            // Проверка уникальности email
            const emailExists = await pool.request()
                .input('Email', sql.NVarChar, email)
                .input('Id', sql.Int, id)
                .query('SELECT 1 FROM Users WHERE Email = @Email AND Id <> @Id');

            if (emailExists.recordset.length > 0) {
                errors.email = 'Email уже используется';
            } else {
                updates.Email = email;
            }
        }

        // Обновление роли (если предоставлено)
        if (role !== undefined && role !== currentUser.Role) {
            updates.Role = role;
        }

        // Обновление позиции
        if (position !== undefined) {
            updates.Position = position;
        }

        // Обновление телефона
        if (phone !== undefined) {
            updates.Phone = phone;
        }

        // Если есть ошибки валидации
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Ошибки валидации',
                errors 
            });
        }

        // Если нет изменений
        if (Object.keys(updates).length === 0) {
            return res.status(200).json({
                message: 'Изменений не обнаружено'
            });
        }

        // Формируем и выполняем запрос на обновление
        const updateFields = Object.keys(updates)
            .map(field => `${field} = @${field}`)
            .join(', ');

        const request = pool.request()
            .input('Id', sql.Int, id);

        // Добавляем параметры для каждого обновляемого поля
        Object.entries(updates).forEach(([key, value]) => {
            request.input(key, sql.NVarChar, value);
        });

        await request.query(
            `UPDATE Users SET ${updateFields} WHERE Id = @Id`
        );

        res.json({
            success: true,
            message: 'Данные пользователя успешно обновлены',
            updatedFields: Object.keys(updates)
        });

    } catch (error) {
        console.error('Ошибка при обновлении пользователя:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при обновлении данных'
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'Неверный ID пользователя' });
    }

    try {
        const pool = await poolPromise;

        // Проверяем существование пользователя
        const userResult = await pool.request()
            .input('Id', sql.Int, id)
            .query('SELECT Id FROM Users WHERE Id = @Id');

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Удаляем пользователя
        await pool.request()
            .input('Id', sql.Int, id)
            .query('DELETE FROM Users WHERE Id = @Id');

        res.json({
            success: true,
            message: 'Пользователь успешно удален'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при удалении пользователя',
            error: error.message
        });
    }
};

// Добавьте в экспорт
module.exports = { getUsers, createUser, updateUser, deleteUser };

