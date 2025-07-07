const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');
// const { requireAdmin } = require('../middleware/auth'); // если есть мидлвар для админа

router.get('/', positionController.getPositions);
// router.use(requireAdmin); // раскомментировать если есть мидлвар
router.post('/', positionController.addPosition);
router.put('/:id', positionController.updatePosition);
router.delete('/:id', positionController.deletePosition);

module.exports = router; 