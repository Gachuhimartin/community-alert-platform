const express = require('express');
const { register, login } = require('../controllers/authController');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      community: req.user.community,
      role: req.user.role
    }
  });
});

module.exports = router;