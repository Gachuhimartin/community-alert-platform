const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, category, maxAttendees } = req.body;

    const event = new Event({
      title,
      description,
      date,
      location,
      category,
      maxAttendees,
      createdBy: req.user._id,
      community: req.user.community,
      attendees: [req.user._id]
    });

    await event.save();
    // FIXED: Populate both createdBy and attendees
    await event.populate('createdBy', 'username');
    await event.populate('attendees', 'username');

    // Emit socket event for new event notification
    const io = req.app.get('socketio');
    io.to(req.user.community).emit('event_broadcast', event);

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ community: req.user.community })
      .populate('createdBy', 'username email')
      .populate('attendees', 'username email')
      .sort({ date: 1 });

    console.log('📅 Events fetched:', events.length);

    // Debug each event
    events.forEach(event => {
      console.log(`Event: ${event.title}`);
      console.log(`Attendees:`, event.attendees.map(a => ({
        id: a._id ? a._id.toString() : a.toString(),
        username: a.username || 'N/A'
      })));
    });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.joinEvent = async (req, res) => {
  try {
    console.log('🔄 Join event attempt:', {
      eventId: req.params.id,
      userId: req.user._id,
      username: req.user.username
    });

    // First get event WITHOUT populating to check raw IDs
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('📊 Event details:', {
      title: event.title,
      currentAttendees: event.attendees,
      maxAttendees: event.maxAttendees
    });

    // FIXED: Simple check using string comparison
    const isAlreadyAttending = event.attendees.some(attendee =>
      attendee.toString() === req.user._id.toString()
    );

    console.log('✅ Attendance check:', {
      isAlreadyAttending,
      userId: req.user._id.toString(),
      attendees: event.attendees.map(a => a.toString())
    });

    if (isAlreadyAttending) {
      return res.status(400).json({ message: 'Already joined this event' });
    }

    if (event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Add user and save
    event.attendees.push(req.user._id);
    await event.save();

    // Populate for emit and response
    const populatedEvent = await Event.findById(event._id)
      .populate('attendees', 'username')
      .populate('createdBy', 'username');

    // Emit socket event for event joined notification
    const io = req.app.get('socketio');
    io.to(req.user.community).emit('event_joined', {
      event: populatedEvent,
      user: { _id: req.user._id, username: req.user.username }
    });

    console.log('🎉 User added to event. New attendees:', event.attendees);

    return res.json({
      message: 'Successfully joined event',
      event: populatedEvent
    });
  } catch (error) {
    console.error('❌ Join event error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
