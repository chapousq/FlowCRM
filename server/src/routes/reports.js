const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/sales', reportController.getSalesReport);
router.get('/export/:type', reportController.getExport);

module.exports = router;
