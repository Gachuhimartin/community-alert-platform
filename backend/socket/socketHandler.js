const EventMessage = require('../models/EventMessage');
const Event = require('../models/Event');
const AlertMessage = require('../models/AlertMessage');
const Alert = require('../models/Alert');
const jwt = require('jsonwebtoken');

module.exports = (io) => {

  // =========================================================
  // 🔐 SOCKET AUTH MIDDLEWARE
  // =========================================================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log("❌ No token provided for socket connection");
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user details
      socket.userId = decoded.userId;

      // Fetch username
      const User = require('../models/User');
      const user = await User.findById(decoded.userId).select('username');

      if (!user) {
        console.log("❌ User not found in DB for socket");
        return next(new Error("Authentication error: User not found"));
      }

      socket.username = user.username;
      console.log("✅ Socket authenticated for user:", socket.username);

      next();
    } catch (err) {
      console.log("❌ Socket authentication failed:", err.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // =========================================================
  // 🔌 CONNECTION
  // =========================================================
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id, "| User:", socket.username);

    // =========================================================
    // 🏘 JOIN COMMUNITY  (needed for alert validation)
    // =========================================================
    socket.on("join_community", (community) => {
      socket.community = community; // FIX: Now stored correctly
      socket.join(`community_${community}`);

      console.log(`🏘 User ${socket.username} joined community: ${community}`);
    });

    // =========================================================
    // 📅 EVENT CHAT SYSTEM
    // =========================================================

    // Join event room
    socket.on("join_event", (eventId) => {
      socket.join(`event_${eventId}`);

      console.log(`📅 User ${socket.username} joined event: ${eventId}`);

      socket.to(`event_${eventId}`).emit("user_joined", {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });
    });

    // Send event message
    socket.on("send_event_message", async (data) => {
      try {
        const event = await Event.findById(data.eventId);
        if (!event) {
          return socket.emit("message_error", { error: "Event not found" });
        }

        // Verify attendee
        const isAttending = event.attendees.some(
          (id) => id.toString() === socket.userId.toString()
        );

        if (!isAttending) {
          return socket.emit("message_error", {
            error: "You must be attending the event to send messages"
          });
        }

        const message = new EventMessage({
          eventId: data.eventId,
          userId: socket.userId,
          username: socket.username,
          message: data.message,
          timestamp: data.timestamp
        });

        await message.save();

        io.to(`event_${data.eventId}`).emit("new_event_message", {
          _id: message._id,
          eventId: data.eventId,
          userId: socket.userId,
          username: socket.username,
          message: data.message,
          timestamp: data.timestamp
        });

      } catch (err) {
        console.error("❌ Event message error:", err);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // Event typing indicator
    socket.on("user_typing", (data) => {
      socket.to(`event_${data.eventId}`).emit("user_typing", {
        userId: socket.userId,
        username: socket.username,
        eventId: data.eventId
      });
    });

    // Leave event chat
    socket.on("leave_event", (eventId) => {
      socket.leave(`event_${eventId}`);

      socket.to(`event_${eventId}`).emit("user_left", {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });

      console.log(`📅 User ${socket.username} left event: ${eventId}`);
    });

    // =========================================================
    // 🚨 ALERT CHAT SYSTEM
    // =========================================================

    // Join alert room
    socket.on("join_alert", async (alertId) => {
      const alert = await Alert.findById(alertId);

      if (!alert) {
        return socket.emit("alert_error", { error: "Alert not found" });
      }

      // SECURITY: verify community
      if (alert.community.toString() !== socket.community) {
        return socket.emit("alert_error", { error: "Access denied" });
      }

      socket.join(`alert_${alertId}`);
      console.log(`🚨 User ${socket.username} joined alert: ${alertId}`);

      socket.to(`alert_${alertId}`).emit("alert_user_joined", {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });
    });

    // Send alert message
    socket.on("send_alert_message", async (data) => {
      try {
        const alert = await Alert.findById(data.alertId);

        if (!alert) {
          return socket.emit("alert_message_error", { error: "Alert not found" });
        }

        // SECURITY FIX
        if (alert.community.toString() !== socket.community) {
          return socket.emit("alert_message_error", { error: "Access denied" });
        }

        const alertMsg = new AlertMessage({
          alertId: data.alertId,
          userId: socket.userId,
          username: socket.username,
          message: data.message,
          timestamp: data.timestamp
        });

        await alertMsg.save();

        io.to(`alert_${data.alertId}`).emit("new_alert_message", {
          _id: alertMsg._id,
          alertId: data.alertId,
          userId: socket.userId,
          username: socket.username,
          message: data.message,
          timestamp: data.timestamp
        });

      } catch (err) {
        console.error("❌ Alert message error:", err);
        socket.emit("alert_message_error", { error: "Failed to send message" });
      }
    });

    // Alert typing indicator
    socket.on("alert_user_typing", (data) => {
      socket.to(`alert_${data.alertId}`).emit("alert_user_typing", {
        alertId: data.alertId,
        userId: socket.userId,
        username: socket.username
      });
    });

    // Leave alert chat
    socket.on("leave_alert", (alertId) => {
      socket.leave(`alert_${alertId}`);

      socket.to(`alert_${alertId}`).emit("alert_user_left", {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });

      console.log(`🚨 User ${socket.username} left alert: ${alertId}`);
    });

    // =========================================================
    // ❌ DISCONNECT / ERRORS
    // =========================================================
    socket.on("disconnect", (reason) => {
      console.log(`❌ ${socket.username} disconnected. Reason:`, reason);
    });

    socket.on("error", (err) => {
      console.error("❌ Socket error:", err);
    });
  });
};
