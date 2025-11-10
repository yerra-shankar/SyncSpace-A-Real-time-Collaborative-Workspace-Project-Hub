# 🧾 Software Requirements Specification (SRS)
## Project Title: SyncSpace
### Developed by: Yerra Shankar  
### Internship Project – Zaalima Development

---

## 1. Introduction  

### 1.1 Purpose  
The purpose of this document is to define the **Software Requirements Specification (SRS)** for **SyncSpace** — a real-time collaboration platform designed for teams to manage tasks, share documents, communicate, and work together efficiently.  

### 1.2 Scope  
SyncSpace allows users to:  
- Create and manage multiple workspaces  
- Manage projects and Kanban tasks  
- Edit and collaborate on documents  
- Communicate via real-time chat  
- Upload and manage files  
- Manage team members and roles  

It’s built using the **MERN stack (MongoDB, Express, React, Node.js)** with **Socket.IO** for real-time features.

---

## 2. Overall Description  

### 2.1 Product Perspective  
SyncSpace integrates project management, document editing, chat, and file sharing in a single platform. It uses a client-server architecture with modular APIs.

### 2.2 Product Features  
- 🔐 Secure Login & Registration  
- 🧭 Dashboard Overview  
- 🧩 Workspaces with Projects & Tasks  
- 🗂️ Kanban Board: To-Do, In Progress, Done  
- 📄 Document Editor (bold, italic, images, lists, headings)  
- 💬 Real-time Chat  
- 📁 File Uploads (PDFs, Images, Docs)  
- 👥 Member Management (Admin, Member, Viewer)  
- 🌙 Dark/Light Mode  
- 🔔 Real-time Notifications  

---

## 3. Functional Requirements  

| Feature | Description |
|----------|-------------|
| User Authentication | Secure login and registration using JWT |
| Dashboard | Display workspace summary and quick stats |
| Create Workspace | Add new workspace with name and description |
| Kanban Board | Add, edit, delete tasks with drag & drop |
| Task Management | Manage title, description, priority, due date, assignee, status |
| Documents | Create and edit rich text content |
| Chat | Real-time communication among workspace members |
| File Upload | Upload and manage files within workspace |
| Member Management | Manage users and their roles |
| Notifications | Real-time task and message notifications |

---

## 4. Non-Functional Requirements  

| Category | Requirement |
|-----------|--------------|
| Performance | Handle 100+ real-time users smoothly |
| Security | Use JWT and HTTPS for data protection |
| Reliability | Recover smoothly from server restarts |
| Usability | Intuitive and responsive UI |
| Scalability | Easy to extend with new modules |
| Maintainability | Modular code using MVC architecture |
| Compatibility | Works on all modern browsers |

---

## 5. System Design  

### Architecture  
- **Frontend:** ReactJS + Vite  
- **Backend:** Node.js + Express.js  
- **Database:** MongoDB Atlas  
- **Real-Time:** Socket.IO  
- **Authentication:** JWT  
- **Cloud Storage:** Cloudinary  

### Modules  
1. Authentication  
2. Dashboard  
3. Workspaces  
4. Kanban Board  
5. Documents  
6. Chat  
7. File Manager  
8. Notifications  

---

## 6. User Interface  

- **Login/Register:** Simple UI with validation  
- **Dashboard:** Cards for stats and navigation  
- **Workspace:** Sidebar with Kanban, Documents, Chat, Files, Members  
- **Kanban Board:** Drag-and-drop tasks  
- **Document Editor:** Bold, italic, headings, image upload  
- **Chat:** Real-time conversation UI  
- **Files:** File preview and upload  
- **Members:** List with search and roles  

---

## 7. Tools & Technologies  

| Category | Tools Used |
|-----------|-------------|
| Frontend | ReactJS, TailwindCSS, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Real-time | Socket.IO |
| Auth | JWT |
| File Handling | Cloudinary |
| Dev Tools | VS Code, GitHub |
| Deployment | Render / Vercel |

---

## 8. Testing  

- Unit and API testing for backend routes  
- Integration testing for frontend-backend connection  
- UI testing for responsive design  
- Real-time testing for socket-based modules  

---

## 9. Future Enhancements  

- Add video conferencing  
- Calendar & reminders  
- AI-based task recommendations  
- Google Drive / Dropbox integration  

---

## 10. Conclusion  

The **SyncSpace** project combines real-time communication, task management, and collaboration tools into a single platform.  
It enhanced my full-stack development skills and gave me valuable experience during my internship at **Zaalima Development**.

---

📌 *End of Document*
