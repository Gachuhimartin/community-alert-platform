const express = require('express');
const { createEvent, getEvents, joinEvent } = require('../controllers/eventController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createEvent);
router.get('/', auth, getEvents);
router.post('/:id/join', auth, joinEvent);

module.exports = router;