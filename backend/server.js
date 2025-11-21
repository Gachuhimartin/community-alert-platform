const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const alertRoutes = require('./routes/alerts');
const eventRoutes = require('./routes/events');
const eventMessageRoutes = require('./routes/eventMessages');
const alertMessageRoutes = require('./routes/alertMessages');

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Initialize Express
const app = express();
const server = createServer(app);

// Connect to Database
connectDB();


// ✅ NEW CODE (ALLOWS BOTH LOCALHOST AND PRODUCTION):
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://community-alert-platform.vercel.app",
    "https://community-alert-platform-nvnwtpoe3-gachuhimartins-projects.vercel.app"
  ],
  credentials: true
}));

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/event-messages', eventMessageRoutes);
app.use('/api/alert-messages', alertMessageRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Community Alert API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});


// ✅ FIX SOCKET.IO CORS TOO:
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://community-alert-platform.vercel.app",
      "https://community-alert-platform-nvnwtpoe3-gachuhimartins-projects.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible to routes
app.set('socketio', io);

// Socket.io Connection Handling
require('./socket/socketHandler')(io);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ CORS enabled for: http://localhost:5173, https://community-alert-platform.vercel.app`);
});