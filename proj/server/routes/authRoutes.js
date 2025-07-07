const express = require('express');
const router = express.Router();
const { login, changePassword, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.put('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

module.exports = router;