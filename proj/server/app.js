const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recordRoutes = require('./routes/recordRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const externalConnectionRoutes = require('./routes/externalConnectionRoutes');
const positionRoutes = require('./routes/positionRoutes');
const curatorRoutes = require('./routes/curatorRoutes');
const bcrypt = require('bcryptjs');
const { poolPromise, sql } = require('./config/db'); // путь может отличаться

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/external-connections', externalConnectionRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/curators', curatorRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

async function createAdminIfNotExists() {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('Username', sql.NVarChar, 'admin')
        .query('SELECT 1 FROM Users WHERE Username = @Username');
    if (result.recordset.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('1', salt);
        await pool.request()
            .input('Username', sql.NVarChar, 'admin')
            .input('Email', sql.NVarChar, 'admin@example.com')
            .input('Password', sql.NVarChar, hash)
            .input('Role', sql.NVarChar, 'admin')
            .input('FirstLogin', sql.Bit, 1)
            .input('IsActive', sql.Bit, 1)
            .input('Position', sql.NVarChar, null)
            .input('Phone', sql.NVarChar, null)
            .input('LastPasswordChange', sql.DateTime, new Date())
            .query(`INSERT INTO Users (Username, Email, Password, Role, FirstLogin, IsActive, Position, Phone, LastPasswordChange)
                    VALUES (@Username, @Email, @Password, @Role, @FirstLogin, @IsActive, @Position, @Phone, @LastPasswordChange)`);
        console.log('Admin user created with password 1');
    } else {
        console.log('Admin already exists');
    }
}

module.exports = app;