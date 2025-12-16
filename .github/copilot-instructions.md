# Split Star - Full-Stack Group Management Application

This project is a modern React + Node.js application with MongoDB integration for managing groups and splitting expenses.

## Project Structure
- **Frontend**: React 19 + Vite with glassmorphism UI design
- **Backend**: Node.js + Express + MongoDB with JWT authentication
- **Database**: MongoDB with Mongoose ODM

## Development Setup
1. Install dependencies: `npm install` (root) and `cd backend && npm install`
2. Configure environment variables (see .env.example files)
3. Start development servers: `npm run dev:full`

## Key Features
- Full-stack authentication system
- Group creation and management
- Real-time settings synchronization
- Responsive glassmorphism design
- MongoDB data persistence
- JWT-based security

## API Endpoints
- Authentication: `/api/auth/*`
- Groups: `/api/groups/*` 
- Users: `/api/users/*`

The application gracefully falls back to demo mode when the backend is unavailable.
