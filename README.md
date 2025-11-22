 LocalConnect - Community Alert Platform
 - 🌍 Supports UN SDG 11 -  Sustainable Cities and Communities


 🚀Live site at:https://community-alert-platform.vercel.app

A real-time community engagement platform that enables neighbors to share alerts, organize events, and coordinate through live chat. Built with the MERN stack and Socket.io for instant communication.
🚀 Live Demo

    Frontend: https://community-alert-platform.vercel.app

    Backend API: https://community-alert-platform.onrender.com

    API Health Check: https://community-alert-platform.onrender.com/api/health

📋 Features
🚨 Real-time Alerts

    Create emergency alerts and community notifications

    Categorize by severity (Low, Medium, High, Critical)

    Real-time broadcast to all community members

    Alert-specific chat for coordination

📅 Community Events

    Organize local events (cleanups, meetings, workshops)

    Set attendance limits and track participants

    Real-time event chat with typing indicators

    Join/leave notifications
    
    🚨🚨One can only see event and alerts in you have join with the name of that community.You cannot see the events or alerts of another community🚨🚨

💬 Live Chat System

    Instant messaging within alerts and events

    Online user presence indicators

    Typing indicators

    Message persistence and history

🔐 Secure Authentication

    JWT-based authentication

    Password encryption

    Protected routes and API endpoints

    Community-based access control

🛠️ Tech Stack

Frontend:

    ⚛️ React 18 with Vite

    🎨 Tailwind CSS v4

    🔄 React Router DOM

    📡 Socket.io Client

    🔗 Axios for API calls

Backend:

    🟢 Node.js & Express.js

    🗄️ MongoDB with Mongoose

    🔌 Socket.io for real-time features

    🔒 JWT Authentication

    🛡️ Helmet & CORS security

Deployment:

    ☁️ Vercel (Frontend)

    ⚡ Render (Backend)

    🗄️ MongoDB Atlas (Database)

🏗️ Project Structure
text

localconnect/
├── frontend/                 # React Vite application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React Context providers
│   │   └── utils/          # Utilities and constants
│   ├── package.json
│   └── vite.config.js
│
└── backend/                 # Node.js Express API
    ├── controllers/         # Route controllers
    ├── models/             # MongoDB models
    ├── routes/             # API routes
    ├── middleware/         # Custom middleware
    ├── socket/             # Socket.io handlers
    ├── server.js           # Entry point
    └── package.json

🚀 Quick Start
Prerequisites

    Node.js 18+

    MongoDB Atlas account

    Git

Local Development

    Clone the repository
    bash

git clone https://github.com/your-username/community-alert-platform.git
cd localconnect

Backend Setup
bash

cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB and JWT settings
npm run dev

Frontend Setup
bash

cd ../frontend
npm install
npm run dev

    Access the application

        Frontend: http://localhost:5173

        Backend API: http://localhost:5000

📡 API Endpoints
Authentication

    POST /api/auth/register - User registration

    POST /api/auth/login - User login

    GET /api/auth/me - Get current user

Alerts

    GET /api/alerts - Get all community alerts

    POST /api/alerts - Create new alert

    PATCH /api/alerts/:id/status - Update alert status

    DELETE /api/alerts/:id - Delete alert

Events

    GET /api/events - Get all community events

    POST /api/events - Create new event

    POST /api/events/:id/join - Join event

Chat Messages

    GET /api/event-messages/:eventId - Get event message history

    GET /api/alert-messages/:alertId - Get alert message history

🔌 Real-time Events
Socket.io Events

    alert_broadcast - New alert created

    alert_updated - Alert status updated

    alert_deleted - Alert deleted

    new_event_message - New event chat message

    new_alert_message - New alert chat message

    user_typing - Typing indicators

    user_joined - User joined chat

    user_left - User left chat

🌟 Key Features Demo

    Real-time Alerts: Create an alert and see it instantly appear in another browser

    Event Coordination: Create an event, join it, and use the live chat

    Community Chat: Coordinate emergency responses through alert chats

    User Presence: See who's online in real-time chats

🚀 Deployment

This project is configured for easy deployment:

    Frontend: Automatic deployments via Vercel

    Backend: Continuous deployment via Render

    Database: MongoDB Atlas cloud database

🤝 Contributing

    Fork the project

    Create your feature branch (git checkout -b feature/AmazingFeature)

    Commit your changes (git commit -m 'Add some AmazingFeature')

    Push to the branch (git push origin feature/AmazingFeature)

    Open a Pull Request

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
👥 Authors

    Your Name - Initial work - YourGitHub

🙏 Acknowledgments

    UN Sustainable Development Goals (SDG 11) inspiration : Sustainable Cities and Communities

    MongoDB Atlas for database hosting

    Vercel & Render for deployment platforms

    Socket.io for real-time functionality

<div align="center">

Built with ❤️ for stronger communities

Part of the solution for Sustainable Cities and Communities (UN SDG 11)
</div>


👤 Author
Martin Gachuhi




