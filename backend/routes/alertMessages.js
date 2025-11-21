const express = require('express');
const AlertMessage = require('../models/AlertMessage');
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');
const router = express.Router();

// Get message history for an alert
router.get('/:alertId', auth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Anyone in the community can view alert messages
    if (alert.community !== req.user.community) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await AlertMessage.find({ alertId: req.params.alertId })
      .populate('userId', 'username')
      .sort({ timestamp: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;