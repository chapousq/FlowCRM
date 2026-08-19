const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', tagController.list);
router.post('/', tagController.create);
router.delete('/:id', tagController.delete);
router.post('/contact', tagController.addToContact);
router.delete('/contact/:contact_id/:tag_id', tagController.removeFromContact);
router.get('/contact/:contactId', tagController.getContactTags);

module.exports = router;
