# SyncSpace Backend

A comprehensive collaboration platform backend built with Node.js, Express.js, MongoDB, and Socket.IO. SyncSpace provides real-time workspace management, project collaboration, Kanban task boards, document editing, team chat, and file sharing.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Workspace Management** - Create and manage multiple workspaces with team members
- **Project Management** - Organize work into projects with customizable settings
- **Kanban Board** - Real-time task management with drag-and-drop functionality
- **Document Collaboration** - Real-time collaborative document editing with version control
- **Team Chat** - Instant messaging with channels, direct messages, and reactions
- **File Management** - Upload, share, and manage files with cloud storage integration
- **Notifications** - Real-time notifications via Socket.IO and email

### Real-time Features
- Live document collaboration with cursor tracking
- Real-time chat with typing indicators
- Kanban board updates
- Instant notifications
- User presence tracking

### Security Features
- Password encryption with bcrypt
- JWT token authentication
- Refresh token mechanism
- Email verification
- Password reset functionality
- Input validation and sanitization
- Rate limiting (planned)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/syncspace-backend.git
cd syncspace-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy the `.env.example` file to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/syncspace

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRE=30d

# Email Configuration (for development use Ethereal)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your_ethereal_email
EMAIL_PASSWORD=your_ethereal_password
EMAIL_FROM=noreply@syncspace.com
EMAIL_FROM_NAME=SyncSpace

# Cloudinary Configuration (Optional - for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Socket.IO Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000
```

4. **Create upload directories**
```bash
mkdir -p uploads/documents uploads/images uploads/files uploads/avatars
mkdir -p logs
```

5. **Start MongoDB** (if running locally)
```bash
mongod
```

6. **Run the application**

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📁 Project Structure
```
syncspace-backend/
│
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   ├── socket.js        # Socket.IO configuration
│   │   └── cloudinary.js    # Cloudinary configuration
│   │
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Workspace.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── Document.js
│   │   ├── Message.js
│   │   ├── File.js
│   │   └── Notification.js
│   │
│   ├── controllers/         # Route controllers
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
│   ├── routes/              # API routes
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
│   ├── middlewares/         # Custom middlewares
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── validationMiddleware.js
│   │
│   ├── validators/          # Input validation
│   │   ├── authValidator.js
│   │   ├── workspaceValidator.js
│   │   ├── taskValidator.js
│   │   ├── documentValidator.js
│   │   ├── chatValidator.js
│   │   └── fileValidator.js
│   │
│   ├── utils/               # Utility functions
│   │   ├── tokenUtils.js
│   │   ├── emailUtils.js
│   │   ├── cloudinaryUtils.js
│   │   └── helpers.js
│   │
│   ├── socket/              # Socket.IO handlers
│   │   ├── socketHandlers.js
│   │   ├── documentSocket.js
│   │   ├── chatSocket.js
│   │   ├── kanbanSocket.js
│   │   └── notificationSocket.js
│   │
│   └── app.js               # Express app setup
│
├── uploads/                 # File upload directory
├── logs/                    # Application logs
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── server.js               # Server entry point
└── README.md               # This file
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register            - Register new user
POST   /api/auth/login               - Login user
POST   /api/auth/refresh-token       - Refresh access token
POST   /api/auth/logout              - Logout user
POST   /api/auth/forgot-password     - Request password reset
POST   /api/auth/reset-password/:token - Reset password
GET    /api/auth/verify-email/:token - Verify email
POST   /api/auth/resend-verification - Resend verification email
GET    /api/auth/me                  - Get current user
POST   /api/auth/change-password     - Change password
```

### Users
```
GET    /api/users                    - Get all users (Admin)
GET    /api/users/search             - Search users
GET    /api/users/:id                - Get user by ID
PUT    /api/users/:id                - Update user
DELETE /api/users/:id                - Delete user (Admin)
POST   /api/users/:id/upload-avatar  - Upload avatar
GET    /api/users/:id/workspaces     - Get user workspaces
GET    /api/users/:id/notifications  - Get user notifications
PATCH  /api/users/:id/status         - Update user status
GET    /api/users/:id/activity       - Get user activity
```

### Workspaces
```
POST   /api/workspaces               - Create workspace
GET    /api/workspaces               - Get user workspaces
GET    /api/workspaces/:id           - Get workspace by ID
PUT    /api/workspaces/:id           - Update workspace
DELETE /api/workspaces/:id           - Delete workspace
POST   /api/workspaces/:id/members   - Add member
DELETE /api/workspaces/:id/members/:userId - Remove member
PATCH  /api/workspaces/:id/members/:userId/role - Update member role
GET    /api/workspaces/:id/members   - Get workspace members
GET    /api/workspaces/:id/projects  - Get workspace projects
POST   /api/workspaces/:id/invite    - Invite member
POST   /api/workspaces/:id/leave     - Leave workspace
```

### Projects
```
POST   /api/projects                 - Create project
GET    /api/projects                 - Get user projects
GET    /api/projects/:id             - Get project by ID
PUT    /api/projects/:id             - Update project
DELETE /api/projects/:id             - Delete project
POST   /api/projects/:id/members     - Add project member
DELETE /api/projects/:id/members/:userId - Remove project member
GET    /api/projects/:id/members     - Get project members
GET    /api/projects/:id/tasks       - Get project tasks
GET    /api/projects/:id/documents   - Get project documents
PATCH  /api/projects/:id/status      - Update project status
GET    /api/projects/:id/activity    - Get project activity
POST   /api/projects/:id/archive     - Archive/Unarchive project
```

### Tasks
```
POST   /api/tasks                    - Create task
GET    /api/tasks                    - Get user tasks
GET    /api/tasks/:id                - Get task by ID
PUT    /api/tasks/:id                - Update task
DELETE /api/tasks/:id                - Delete task
PATCH  /api/tasks/:id/status         - Update task status
PATCH  /api/tasks/:id/priority       - Update task priority
PATCH  /api/tasks/:id/assign         - Assign task
PATCH  /api/tasks/:id/unassign       - Unassign task
POST   /api/tasks/:id/comments       - Add comment
DELETE /api/tasks/:id/comments/:commentId - Delete comment
GET    /api/tasks/:id/comments       - Get task comments
PATCH  /api/tasks/:id/move           - Move task (Kanban)
POST   /api/tasks/:id/subtasks       - Add subtask
PATCH  /api/tasks/:id/subtasks/:subtaskId - Update subtask
DELETE /api/tasks/:id/subtasks/:subtaskId - Delete subtask
POST   /api/tasks/:id/attachments    - Add attachment
DELETE /api/tasks/:id/attachments/:attachmentId - Delete attachment
```

### Documents
```
POST   /api/documents                - Create document
GET    /api/documents                - Get user documents
GET    /api/documents/:id            - Get document by ID
PUT    /api/documents/:id            - Update document
DELETE /api/documents/:id            - Delete document
PATCH  /api/documents/:id/content    - Update document content
POST   /api/documents/:id/share      - Share document
DELETE /api/documents/:id/share/:userId - Remove document access
GET    /api/documents/:id/collaborators - Get document collaborators
GET    /api/documents/:id/versions   - Get document versions
POST   /api/documents/:id/versions/:versionId/restore - Restore version
POST   /api/documents/:id/lock       - Lock document
POST   /api/documents/:id/unlock     - Unlock document
POST   /api/documents/:id/duplicate  - Duplicate document
GET    /api/documents/:id/export     - Export document
POST   /api/documents/:id/comments   - Add comment
DELETE /api/documents/:id/comments/:commentId - Delete comment
```

### Chat
```
POST   /api/chat/messages            - Send message
GET    /api/chat/workspace/:workspaceId/messages - Get workspace messages
GET    /api/chat/project/:projectId/messages - Get project messages
GET    /api/chat/direct/:userId/messages - Get direct messages
GET    /api/chat/messages/:id        - Get message by ID
PUT    /api/chat/messages/:id        - Edit message
DELETE /api/chat/messages/:id        - Delete message
POST   /api/chat/messages/:id/react  - Add reaction
DELETE /api/chat/messages/:id/react  - Remove reaction
POST   /api/chat/messages/:id/pin    - Pin message
DELETE /api/chat/messages/:id/pin    - Unpin message
GET    /api/chat/workspace/:workspaceId/pinned - Get pinned messages
POST   /api/chat/messages/:id/read   - Mark as read
GET    /api/chat/unread              - Get unread count
POST   /api/chat/typing              - Send typing indicator
GET    /api/chat/search              - Search messages
POST   /api/chat/channels            - Create channel
GET    /api/chat/channels/:channelId/messages - Get channel messages
```

### Files
```
POST   /api/files/upload             - Upload file
POST   /api/files/upload-multiple    - Upload multiple files
GET    /api/files/:id                - Get file metadata
GET    /api/files/:id/download       - Download file
DELETE /api/files/:id                - Delete file
GET    /api/files/workspace/:workspaceId - Get workspace files
GET    /api/files/project/:projectId - Get project files
GET    /api/files/task/:taskId       - Get task files
GET    /api/files/document/:documentId - Get document files
PATCH  /api/files/:id                - Update file metadata
POST   /api/files/:id/share          - Share file
GET    /api/files/:id/preview        - Get file preview
POST   /api/files/:id/move           - Move file
POST   /api/files/:id/copy           - Copy file
GET    /api/files/search             - Search files
GET    /api/files/recent             - Get recent files
```

### Notifications
```
GET    /api/notifications            - Get notifications
GET    /api/notifications/unread     - Get unread count
GET    /api/notifications/:id        - Get notification by ID
PATCH  /api/notifications/:id/read   - Mark as read
PATCH  /api/notifications/read-all   - Mark all as read
DELETE /api/notifications/:id        - Delete notification
DELETE /api/notifications            - Delete all notifications
GET    /api/notifications/type/:type - Get by type
POST   /api/notifications/preferences - Update preferences
GET    /api/notifications/preferences - Get preferences
POST   /api/notifications/test       - Send test notification
```

## 🔄 Socket.IO Events

### Connection
```
connection                - User connected
disconnect                - User disconnected
```

### Workspace/Project
```
join:workspace            - Join workspace room
leave:workspace           - Leave workspace room
join:project              - Join project room
leave:project             - Leave project room
user:status               - Update user status
typing:start              - Start typing
typing:stop               - Stop typing
```

### Document Collaboration
```
document:join             - Join document editing session
document:leave            - Leave document session
document:change           - Document content changed
document:cursor           - Cursor position update
document:selection        - Selection update
document:lock             - Lock document
document:unlock           - Unlock document
document:comment:add      - Add document comment
document:version:save     - Save document version
```

### Chat
```
chat:join                 - Join chat room
chat:leave                - Leave chat room
chat:message:send         - Send message
chat:message:edit         - Edit message
chat:message:delete       - Delete message
chat:reaction:add         - Add reaction
chat:reaction:remove      - Remove reaction
chat:typing:start         - Start typing
chat:typing:stop          - Stop typing
chat:message:read         - Mark message as read
chat:message:pin          - Pin message
chat:message:unpin        - Unpin message
```

### Kanban
```
kanban:join               - Join Kanban board
kanban:leave              - Leave Kanban board
kanban:task:create        - Create task
kanban:task:update        - Update task
kanban:task:move          - Move task
kanban:task:delete        - Delete task
kanban:task:assign        - Assign task
kanban:task:unassign      - Unassign task
kanban:task:priority      - Update priority
kanban:task:comment       - Add comment
kanban:task:progress      - Update progress
kanban:task:subtask:add   - Add subtask
kanban:task:subtask:update - Update subtask
kanban:task:subtask:delete - Delete subtask
kanban:tasks:bulk:update  - Bulk update tasks
kanban:column:reorder     - Reorder column
```

### Notifications
```
notification:subscribe    - Subscribe to notifications
notification:unsubscribe  - Unsubscribe
notification:read         - Mark as read
notification:read:all     - Mark all as read
notification:delete       - Delete notification
notification:delete:all   - Delete all notifications
notification:unread:count - Get unread count
notification:preferences:update - Update preferences
```

## 🧪 Testing

Run tests (when implemented):
```bash
npm test
```

## 📦 Dependencies

### Core Dependencies
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **socket.io** - Real-time bidirectional communication
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **multer** - File upload handling
- **nodemailer** - Email sending
- **cloudinary** - Cloud storage for files
- **dotenv** - Environment variable management
- **cors** - Cross-origin resource sharing

### Dev Dependencies
- **nodemon** - Development auto-reload

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name syncspace
pm2 save
pm2 startup
```

### Using Docker (Coming Soon)
```bash
docker build -t syncspace-backend .
docker run -p 5000:5000 syncspace-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Express.js team
- MongoDB team
- Socket.IO team
- All contributors

## 📞 Support

For support, email support@syncspace.com or join our Slack channel.

## 🔮 Roadmap

- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger)
- [ ] Implement caching (Redis)
- [ ] Add comprehensive testing
- [ ] Implement advanced search
- [ ] Add analytics dashboard
- [ ] Implement video calling
- [ ] Add calendar integration
- [ ] Implement time tracking
- [ ] Add reporting features

---

Made with ❤️ by the SyncSpace Team