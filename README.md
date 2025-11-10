🧩 Project Name: SyncSpace

A Real-Time Collaboration Platform for Seamless Teamwork.
Built with ReactJS (frontend) and Node.js + Express + MongoDB (backend).

🚀 Overview

SyncSpace is a real-time collaboration web application that allows users to connect, communicate, and share tasks instantly.
This project demonstrates a full-stack MERN setup with real-time features using Socket.IO, efficient APIs, and a responsive UI designed for 2025 standards.

🖥️ Tech Stack
🌐 Frontend

--ReactJS
--HTML5, CSS3, JavaScript (ES6+)
--Bootstrap / Tailwind CSS
--Axios for API calls
--React Router DOM for navigation
--Socket.IO Client for real-time updates

⚙️ Backend

--Node.js with Express.js
--MongoDB with Mongoose
--Socket.IO for real-time communication
--JWT Authentication
--Cloudinary (for image/file upload)
--dotenv for environment configuration

📂 Project Structure

syncspace-frontend/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, icons, etc.
│   ├── components/     # React components
│   │   ├── auth/       # Authentication components
│   │   ├── chat/       # Chat components
│   │   ├── dashboard/  # Dashboard components
│   │   ├── documents/  # Document editor components
│   │   ├── files/      # File manager components
│   │   ├── kanban/     # Kanban board components
│   │   ├── layout/     # Layout components
│   │   ├── members/    # Team members components
│   │   ├── modals/     # Modal dialogs
│   │   └── workspace/  # Workspace components
│   ├── context/        # React Context API
│   ├── services/       # API services
│   ├── socket/         # Socket.IO configuration
│   ├── styles/         # CSS stylesheets
│   ├── App.jsx         # Main App component
│   └── main.jsx        # Entry point
├── .env.example        # Environment variables template
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
└── README.md          # This file


syncspace-backend/
│
├── src/
│   ├── config/                  # Configuration files
│   │   ├── database.js          # MongoDB connection
│   │   ├── socket.js            # Socket.IO setup
│   │   └── cloudinary.js        # Cloudinary config
│   │
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Workspace.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── Document.js
│   │   ├── Message.js
│   │   ├── File.js
│   │   └── Notification.js
│   │
│   ├── controllers/             # Business logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── workspaceController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   ├── documentController.js
│   │   ├── chatController.js
│   │   ├── fileController.js
│   │   └── notificationController.js
│   │
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── workspaceRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── fileRoutes.js
│   │   └── notificationRoutes.js
│   │
│   ├── middlewares/             # Custom middlewares
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── validationMiddleware.js
│   │
│   ├── validators/              # Input validation
│   │   ├── authValidator.js
│   │   ├── workspaceValidator.js
│   │   ├── taskValidator.js
│   │   ├── documentValidator.js
│   │   ├── chatValidator.js
│   │   └── fileValidator.js
│   │
│   ├── utils/                   # Utility functions
│   │   ├── tokenUtils.js
│   │   ├── emailUtils.js
│   │   ├── cloudinaryUtils.js
│   │   └── helpers.js
│   │
│   ├── socket/                  # Socket.IO handlers
│   │   ├── socketHandlers.js
│   │   ├── documentSocket.js
│   │   ├── chatSocket.js
│   │   ├── kanbanSocket.js
│   │   └── notificationSocket.js
│   │
│   └── app.js                   # Express app setup
│
├── uploads/                     # Uploaded files
├── logs/                        # Application logs
├── tests/                       # Test files
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
├── server.js                    # Entry point
└── README.md                    # This file

⚡ Installation & Setup
🧱 1. Clone the Repository
git clone https://github.com/yerra-shankar/syncspace.git
cd syncspace

🌐 2. Backend Setup
cd backend
npm install


Create a .env file in /backend:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_URL=your_cloudinary_key


Start the backend:

npm run dev

💻 3. Frontend Setup
cd ../frontend
npm install
npm start

🔁 API Endpoints (Backend)
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login user
GET	/api/users	Get all users
POST	/api/messages	Send message
GET	/api/messages/:chatId	Get chat messages
🔔 Features

✅ Real-time messaging via Socket.IO
✅ JWT-based authentication
✅ MongoDB for secure data storage
✅ Responsive and modern UI
✅ User dashboard with project and chat modules
✅ Cloud upload integration

🧠 Learning Highlights

--Full-stack MERN integration
--RESTful API design
--Real-time WebSocket communication
--Authentication and authorization
--Frontend-backend connectivity
--Environment-based configuration


🧑‍💻 Developer

Yerra Shankar
📍 Visakhapatnam, Andhra Pradesh
📧 yerrashankar9392@gmail.com
📞 9392672508
www.linkedin.com/in/shankar-yerra-full-stack-developer
