const express = require('express');
const router = express.Router();
const curatorController = require('../controllers/curatorController');
// const { requireAdmin } = require('../middleware/auth'); // если есть мидлвар для админа

router.get('/', curatorController.getCurators);
// router.use(requireAdmin); // раскомментировать если есть мидлвар
router.post('/', curatorController.addCurator);
router.put('/:id', curatorController.updateCurator);
router.delete('/:id', curatorController.deleteCurator);

module.exports = router; 