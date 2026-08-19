const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', activityController.list);
router.post('/', activityController.create);
router.put('/:id', activityController.update);
router.delete('/:id', activityController.delete);

module.exports = router;
