const express = require('express');
const { createAlert, getAlerts, updateAlertStatus, deleteAlert } = require('../controllers/alertController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createAlert);
router.get('/', auth, getAlerts);
router.patch('/:id/status', auth, updateAlertStatus);
router.delete('/:id', auth, deleteAlert); // NEW DELETE ROUTE

module.exports = router;