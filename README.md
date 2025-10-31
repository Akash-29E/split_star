# Split Star - Full-Stack Group Management Application

A modern React + Node.js application for managing groups and splitting expenses, with MongoDB database integration and JWT authentication.

## ��� Features

### Frontend (React + Vite)
- **Modern React 19** with Hooks and Context API
- **Glassmorphism UI** with smooth animations
- **Responsive design** for desktop and mobile
- **Group management** - create, view, and manage groups
- **Settings management** with real-time updates
- **Authentication support** with JWT tokens
- **Offline demo mode** when backend is unavailable

### Backend (Node.js + Express + MongoDB)
- **RESTful API** with Express.js
- **MongoDB integration** using Mongoose ODM
- **JWT authentication** system
- **User management** with secure password hashing
- **Group CRUD operations** with member management
- **Input validation** and error handling
- **Security features** (helmet, rate limiting, CORS)

## ��� Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18 or higher)
- **MongoDB** running locally on port 27017, or a MongoDB Atlas connection
- **Git** for version control

## ���️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd split_star

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

**Backend (.env file in `/backend` directory):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/split-star
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
BCRYPT_ROUNDS=12
```

**Frontend (.env file in root directory):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally and start the service
# On macOS with Homebrew:
brew install mongodb-community
brew services start mongodb-community

# On Ubuntu:
sudo apt install mongodb
sudo systemctl start mongodb

# On Windows: Download and install from MongoDB official website
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster and get connection string
3. Update `MONGODB_URI` in backend/.env

## ��� Running the Application

### Development Mode (Recommended)

**Option 1: Run both servers simultaneously**
```bash
npm run dev:full
```

**Option 2: Run servers separately**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

**Option 3: Use VS Code Tasks**
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- Type "Tasks: Run Task"
- Select "Start Full-Stack Development"

### Production Mode
```bash
# Build frontend
npm run build

# Start backend in production
npm run start:backend

# Serve frontend build (using a static server)
npx serve dist
```

## ��� Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

## ��� API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-token` - Verify JWT token

### Group Endpoints
- `GET /api/groups` - Get all user groups
- `GET /api/groups/:id` - Get specific group
- `POST /api/groups` - Create new group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users
- `DELETE /api/users/profile` - Deactivate account

## ���️ Project Structure

```
split_star/
├── src/                          # Frontend React application
│   ├── components/              # React components
│   │   ├── GroupPage.jsx       # Main group view
│   │   ├── GroupSettings.jsx   # Group settings page
│   │   ├── LandingPage.jsx     # Landing/create group page
│   │   └── Navbar.jsx          # Navigation component
│   ├── context/                # React Context providers
│   │   └── AuthContext.jsx     # Authentication state management
│   ├── hooks/                  # Custom React hooks
│   │   └── useAuth.js          # Authentication hook
│   ├── services/               # API service layer
│   │   ├── api.js             # Base API service
│   │   ├── auth.js            # Authentication services
│   │   ├── groups.js          # Group management services
│   │   └── users.js           # User management services
│   └── utils/                  # Utility functions
├── backend/                     # Backend Node.js application
│   ├── models/                 # Mongoose database models
│   │   ├── User.js            # User model with authentication
│   │   └── Group.js           # Group model with members
│   ├── routes/                 # Express route handlers
│   │   ├── auth.js            # Authentication routes
│   │   ├── groups.js          # Group management routes
│   │   └── users.js           # User management routes
│   ├── middleware/             # Express middleware
│   │   └── auth.js            # JWT authentication middleware
│   ├── .env                   # Environment variables
│   └── server.js              # Express server entry point
├── .vscode/                    # VS Code configuration
│   └── tasks.json             # Development tasks
├── package.json               # Frontend dependencies and scripts
└── README.md                  # This file
```

## ��� UI Features

- **Glassmorphism Design** - Modern frosted glass effect
- **Smooth Animations** - Hover effects and transitions
- **Responsive Layout** - Works on desktop and mobile
- **Interactive Elements** - Rotating gear icon, hover effects
- **Error Handling** - User-friendly error messages
- **Loading States** - Proper loading indicators

## ��� Development Scripts

```bash
# Frontend only
npm run dev:frontend          # Start Vite dev server
npm run build                 # Build for production
npm run preview              # Preview production build

# Backend only  
npm run dev:backend          # Start backend with nodemon
npm run start:backend        # Start backend in production

# Full-stack
npm run dev:full            # Start both servers concurrently
```

## ��� Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
- Ensure MongoDB is running locally or check Atlas connection string
- Verify `MONGODB_URI` in backend/.env

**2. CORS Errors**
- Check `FRONTEND_URL` in backend/.env matches frontend URL
- Ensure both servers are running

**3. Authentication Issues**
- Verify `JWT_SECRET` is set in backend/.env
- Check browser localStorage for tokens

**4. Port Already in Use**
- Backend: Change `PORT` in backend/.env
- Frontend: Vite will auto-increment port if 5173 is busy

### Reset Application
```bash
# Clear all data and restart
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install && cd ..
npm run dev:full
```

## ��� License

This project is licensed under the ISC License.

## ��� Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ��� Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the console for error messages
3. Ensure all prerequisites are installed correctly
