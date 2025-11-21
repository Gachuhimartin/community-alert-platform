const express = require('express');
const EventMessage = require('../models/EventMessage');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const router = express.Router();

// Get message history for an event
router.get('/:eventId', auth, async (req, res) => {
  try {
    // Check if user is attending the event
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isAttending = event.attendees.some(attendee => 
      attendee.toString() === req.user._id.toString()
    );

    if (!isAttending) {
      return res.status(403).json({ message: 'You must be attending the event to view messages' });
    }

    const messages = await EventMessage.find({ eventId: req.params.eventId })
      .populate('userId', 'username')
      .sort({ timestamp: 1 })
      .limit(100); // Last 100 messages

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message (handled via socket, but this is backup)
router.post('/:eventId', auth, async (req, res) => {
  try {
    const { message } = req.body;

    // Check if user is attending the event
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isAttending = event.attendees.some(attendee => 
      attendee.toString() === req.user._id.toString()
    );

    if (!isAttending) {
      return res.status(403).json({ message: 'You must be attending the event to send messages' });
    }

    const eventMessage = new EventMessage({
      eventId: req.params.eventId,
      userId: req.user._id,
      username: req.user.username,
      message: message
    });

    await eventMessage.save();
    await eventMessage.populate('userId', 'username');

    res.status(201).json(eventMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;