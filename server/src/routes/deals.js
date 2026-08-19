const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', dealController.list);
router.get('/:id', dealController.get);
router.post('/', dealController.create);
router.put('/:id', dealController.update);
router.delete('/:id', dealController.delete);

module.exports = router;
