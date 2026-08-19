const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.get('/plans', paymentController.getPlans);
router.use(auth);
router.post('/checkout', paymentController.checkout);
router.get('/my-payments', paymentController.getMyPayments);
router.post('/cancel', paymentController.cancelSubscription);

module.exports = router;
