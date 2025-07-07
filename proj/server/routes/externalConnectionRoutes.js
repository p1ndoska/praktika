const express = require('express');
const router = express.Router();
const { addExternalConnection, getExternalConnections, deleteExternalConnection, updateExternalConnection } = require('../controllers/externalConnectionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/add', protect, admin, addExternalConnection);
router.get('/', protect, getExternalConnections);
router.delete('/:id', protect, admin, deleteExternalConnection);
router.put('/:id', protect, updateExternalConnection);

module.exports = router; 