const express = require('express');
const router = express.Router();
const { getOrganizations, addOrganization, deleteOrganization } = require('../controllers/organizationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Получить все организации
router.get('/', protect, getOrganizations);

// Добавить организацию (только для админа)
router.post('/', protect, admin, addOrganization);

// Удалить организацию (только для админа)
router.delete('/:id', protect, admin, deleteOrganization);

module.exports = router; 