const Alert = require('../models/Alert');

exports.createAlert = async (req, res) => {
  try {
    const { title, description, category, severity, location } = req.body;

    const alert = new Alert({
      title,
      description,
      category,
      severity,
      location,
      createdBy: req.user._id,
      community: req.user.community
    });

    await alert.save();
    await alert.populate('createdBy', 'username');

    // Emit socket event
    const io = req.app.get('socketio');
    io.to(req.user.community).emit('alert_broadcast', alert);

    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ community: req.user.community })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await Alert.findOne({
      _id: req.params.id,
      community: req.user.community
    }).populate('createdBy', 'username');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // FIXED: Handle both populated and unpopulated createdBy
    const creatorId = alert.createdBy._id ? alert.createdBy._id.toString() : alert.createdBy.toString();
    
    if (creatorId !== req.user._id.toString()) {
      console.log('🚫 Unauthorized update attempt:', {
        alertId: alert._id,
        alertCreator: creatorId,
        currentUser: req.user._id.toString(),
        user: req.user.username
      });
      return res.status(403).json({ message: 'Only the alert creator can update this alert' });
    }

    alert.status = status;
    await alert.save();

    // Re-populate before sending response
    await alert.populate('createdBy', 'username');

    // Emit socket event
    const io = req.app.get('socketio');
    io.to(req.user.community).emit('alert_updated', alert);

    res.json({ message: 'Alert status updated', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      community: req.user.community
    }).populate('createdBy', 'username'); // FIXED: Populate for consistent checking

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // FIXED: Handle both populated and unpopulated createdBy
    const creatorId = alert.createdBy._id ? alert.createdBy._id.toString() : alert.createdBy.toString();
    
    if (creatorId !== req.user._id.toString()) {
      console.log('🚫 Unauthorized delete attempt:', {
        alertId: alert._id,
        alertCreator: creatorId,
        currentUser: req.user._id.toString(),
        user: req.user.username
      });
      return res.status(403).json({ message: 'Only the alert creator can delete this alert' });
    }

    await Alert.findByIdAndDelete(req.params.id);

    // Emit socket event
    const io = req.app.get('socketio');
    io.to(req.user.community).emit('alert_deleted', req.params.id);

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};