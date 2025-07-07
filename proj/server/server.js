const app = require('./app');
const http = require('http');
const { poolPromise } = require('./config/db');

const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Test database connection and start server
poolPromise.then(() => {
    server.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
    });
}).catch(err => {
    console.error('Database connection failed', err);
    process.exit(1);
});