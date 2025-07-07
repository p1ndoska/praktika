const sql = require('mssql');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // для Azure
        trustServerCertificate: true // для локального развития
    }
};

const dbName = config.database;

async function ensureDatabaseExists() {
    const configNoDb = { ...config };
    delete configNoDb.database;
    const pool = await new sql.ConnectionPool(configNoDb).connect();
    await pool.request()
        .query(`IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${dbName}') CREATE DATABASE [${dbName}]`);
    await pool.close();
}

async function runSqlScripts(pool) {
    const sqlDir = path.join(__dirname, '../sql');
    const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql'));
    for (const file of files) {
        const script = fs.readFileSync(path.join(sqlDir, file), 'utf8');
        try {
            await pool.request().batch(script);
            console.log(`Executed ${file}`);
        } catch (err) {
            // Если таблица уже есть, просто пропускаем ошибку
            if (err.message && err.message.includes('There is already an object named')) {
                console.log(`${file}: already exists, skipping.`);
            } else {
                console.error(`Error executing ${file}:`, err);
            }
        }
    }
}

async function createDefaultAdmin(pool) {
    const adminUsername = 'admin';
    const adminEmail = 'admin@example.com';
    const adminPassword = '1';
    const adminRole = 'admin';

    // Проверяем, есть ли уже админ
    const result = await pool.request()
        .input('Username', sql.NVarChar, adminUsername)
        .query('SELECT 1 FROM Users WHERE Username = @Username');
    if (result.recordset.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(adminPassword, salt);
        await pool.request()
            .input('Username', sql.NVarChar, adminUsername)
            .input('Email', sql.NVarChar, adminEmail)
            .input('Password', sql.NVarChar, hash)
            .input('Role', sql.NVarChar, adminRole)
            .input('FirstLogin', sql.Bit, 1)
            .input('IsActive', sql.Bit, 1)
            .input('Position', sql.NVarChar, null)
            .input('Phone', sql.NVarChar, null)
            .input('LastPasswordChange', sql.DateTime, new Date())
            .query(`INSERT INTO Users (Username, Email, Password, Role, FirstLogin, IsActive, Position, Phone, LastPasswordChange)
                    VALUES (@Username, @Email, @Password, @Role, @FirstLogin, @IsActive, @Position, @Phone, @LastPasswordChange)`);
        console.log('Default admin user created');
    } else {
        console.log('Default admin already exists');
    }
}

const poolPromise = ensureDatabaseExists()
    .then(() => new sql.ConnectionPool(config).connect())
    .then(async pool => {
        console.log('Connected to MSSQL');
        await runSqlScripts(pool);
        await createDefaultAdmin(pool);
        return pool;
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err));

module.exports = {
    sql, poolPromise
};