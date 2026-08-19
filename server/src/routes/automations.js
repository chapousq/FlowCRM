const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', automationController.list);
router.post('/', automationController.create);
router.put('/:id/toggle', automationController.toggle);
router.delete('/:id', automationController.delete);

module.exports = router;
