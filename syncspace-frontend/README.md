# 🎨 SyncSpace - Real-time Collaborative Workspace

![SyncSpace Banner](https://via.placeholder.com/1200x300/667eea/ffffff?text=SyncSpace)

## 📋 Overview

SyncSpace is a modern, real-time collaborative workspace and project management hub built with React.js. It enables teams to manage projects, collaborate on documents, chat in real-time, and share files with version control.

## ✨ Features

- 🔐 **Authentication** - Secure login and registration
- 📊 **Dashboard** - Overview of workspaces and project statistics
- 🗂️ **Workspace Management** - Create and organize team workspaces
- 📋 **Kanban Board** - Drag-and-drop task management
- 📝 **Document Editor** - Real-time collaborative editing
- 💬 **Team Chat** - Instant messaging with typing indicators
- 📁 **File Manager** - Upload and version control for files
- 👥 **Team Members** - Manage team roles and permissions
- 🔔 **Notifications** - Real-time alerts and updates

## 🚀 Tech Stack

- **Frontend Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Real-time:** Socket.IO Client
- **Drag & Drop:** React Beautiful DnD
- **Rich Text Editor:** React Quill
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Notifications:** React Toastify

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/syncspace-frontend.git
cd syncspace-frontend
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your backend API URL and configuration:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

4. **Start development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**

Navigate to `http://localhost:3000`

## 🏗️ Project Structure
```
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
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🌐 API Integration

The frontend connects to the backend API using Axios. Configure the base URL in `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### API Endpoints Used

- `/api/auth/login` - User authentication
- `/api/auth/register` - User registration
- `/api/workspaces` - Workspace CRUD operations
- `/api/projects` - Project management
- `/api/tasks` - Task operations
- `/api/documents` - Document management
- `/api/files` - File upload/download
- `/api/chat` - Chat messages

## 🔌 Real-time Features

SyncSpace uses Socket.IO for real-time collaboration:

- Live document editing with cursor tracking
- Real-time chat messages
- Task updates across users
- Typing indicators
- Online/offline status

## 🎨 Styling

The project uses custom CSS with modern design principles:

- Glassmorphism effects
- Smooth animations and transitions
- Responsive design for all devices
- Dark mode support (coming soon)
- Custom utility classes (no Bootstrap utilities)

## 📱 Responsive Design

SyncSpace is fully responsive and works on:

- 💻 Desktop (1920px+)
- 💻 Laptop (1366px - 1920px)
- 📱 Tablet (768px - 1366px)
- 📱 Mobile (320px - 768px)

## 🚧 Development Roadmap

- [ ] Dark mode theme
- [ ] Offline mode support
- [ ] PWA capabilities
- [ ] Video conferencing
- [ ] Advanced analytics
- [ ] Mobile apps (iOS/Android)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourname)
- Email: your.email@example.com

## 🙏 Acknowledgments

- React.js team for the amazing framework
- Socket.IO for real-time capabilities
- Lucide for beautiful icons
- All contributors and supporters

---

⭐ **Star this repository if you find it helpful!**