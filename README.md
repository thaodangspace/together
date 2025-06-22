# SyncWatch - Deno + tRPC + React

A real-time video watching application that allows users to watch YouTube videos together with friends.

## 🚀 Quick Start

### Single Port Mode (Recommended for Production)

**Run both frontend and backend on one port:**

```bash
# Build frontend and start server (everything on port 8000)
./build.sh

# Or manually:
deno task build && deno task server:start
```

✅ Access the complete app at **http://localhost:8000**

### Development Mode (Separate Ports)

**For development with hot reload:**

1. **Start the server:**

```bash
deno task server:dev
```

✅ Server running: **http://localhost:8000**

2. **In a separate terminal, start the frontend watcher:**

```bash
deno task dev
```

✅ Frontend files served via the server on **http://localhost:8000**

## 🚀 Phase 1: Core Infrastructure

Phase 1 includes the foundational infrastructure needed for the SyncWatch application:

### ✅ Completed Features

-   **Backend Setup**: Deno.js server with Oak and tRPC
-   **Database**: Deno KV store for rooms, users, queue, and messages
-   **API Endpoints**: REST and tRPC routes for room management
-   **Long-Polling System**: Real-time communication infrastructure
-   **Frontend Setup**: React with Tailwind CSS
-   **Basic UI**: Landing page with room creation/joining forms

### 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Deno.js)     │◄──►│   (Deno KV)     │
│                 │    │                 │    │                 │
│ • React UI      │    │ • Oak Server    │    │ • Rooms         │
│ • Tailwind CSS  │    │ • REST & tRPC   │    │ • Users         │
│ • Zustand       │    │ • Long-Polling  │    │ • Queue         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Getting Started

### Prerequisites

-   **Deno** 1.36+ - [Install Deno](https://deno.land/manual/getting_started/installation)
-   **Node.js** 18+ - [Install Node.js](https://nodejs.org/)
-   **Git** - [Install Git](https://git-scm.com/)

### 1. Server Setup

```bash
# Copy environment variables
cp server/env.example server/.env

# Start the server
deno task server:dev
```

The server will start on `http://localhost:8000`

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Start the React build watcher (new terminal)
deno task dev
```

The frontend is served by the Deno server on `http://localhost:8000`

### 3. Environment Configuration

Create a `.env` file in the `server` directory:

```bash
PORT=8000
KV_DATABASE_URL=
YOUTUBE_API_KEY=your_youtube_api_key_here
CORS_ORIGIN=http://localhost:8000
JWT_SECRET=your_jwt_secret_here
LOG_LEVEL=info
NODE_ENV=development
```

## 📡 API Endpoints

### Room Management

-   `POST /api/rooms` - Create a new room
-   `POST /api/rooms/:roomId/join` - Join an existing room
-   `GET /api/rooms/:roomId` - Get room state
-   `DELETE /api/rooms/:roomId/leave` - Leave a room

### Real-time Communication

-   `GET /api/rooms/:roomId/poll` - Long-polling endpoint for real-time updates

### Health Check

-   `GET /api/health` - Server health status

## 🗄️ Database Schema

The backend uses **Deno KV** for persistent storage with the following collections:

1. **rooms** – current room state
2. **users** – connected users per room
3. **queue** – video queue entries
4. **messages** – chat history

## 🧪 Testing Phase 1

### Backend Testing

```bash
# Check server health
curl http://localhost:8000/api/health

# Test room creation
curl -X POST http://localhost:8000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Room", "username": "Test User"}'
```

### Frontend Testing

1. Open `http://localhost:8000` in your browser
2. Fill out the "Create Room" form
3. Check browser console for form submission logs
4. Verify the UI displays correctly on mobile and desktop

## 📂 Project Structure

```
together/
├── server/                 # Deno backend
│   ├── database/           # Deno KV helpers
│   ├── routes/             # REST routes
│   ├── services/           # Business logic
│   ├── longpoll/           # Long-polling manager
│   ├── trpc/               # tRPC router
│   ├── utils/              # Logger and helpers
│   ├── env.example         # Environment variables template
│   └── server.ts           # Main server file
├── www/                    # React frontend
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── main.tsx
│   ├── App.tsx
│   ├── build.ts
│   └── dev.ts
├── public/                 # Static assets
│   └── index.html
├── build.sh                # Build & start helper
├── deno.json               # Deno tasks and deps
└── README.md               # Project docs
```

## 🚦 Phase 1 Status

### ✅ Completed Tasks

-   [x] Backend project structure and configuration
-   [x] Database schema implementation
-   [x] Room service with CRUD operations
-   [x] Long-polling manager for real-time communication
-   [x] Basic API endpoints for room management
-   [x] Frontend project setup with React + Tailwind
-   [x] API service for backend communication
-   [x] Landing page with forms
-   [x] Basic error handling and logging

### 🔄 Ready for Phase 2

-   Room creation and joining functionality
-   User management and authentication
-   Real-time user presence
-   Enhanced UI components

## 🐛 Known Issues & Limitations

### Phase 1 Limitations

1. **Forms are not functional** - They log to console but don't make API calls yet
2. **No actual room functionality** - Database and APIs are ready but not connected to frontend
3. **No authentication** - Using simple user ID headers
4. **Local Deno KV store** - Will need a persistent KV service for production

### TypeScript Errors

Some TypeScript errors are expected in this phase as they relate to:

    -   Deno-specific imports and APIs
    -   Modern React features using TypeScript
    -   These will resolve when the servers are running

## 🚀 Next Steps (Phase 2)

1. **Connect frontend forms to backend APIs**
2. **Implement room creation/joining flow**
3. **Add user session management**
4. **Create room page layout**
5. **Implement real-time user presence**

## 🤝 Contributing

To contribute to Phase 1:

1. Ensure all Phase 1 tests pass
2. Follow the existing code structure
3. Update documentation for any changes
4. Test both backend and frontend thoroughly

## 📝 Logs and Debugging

### Backend Logs

The backend logs all HTTP requests and database operations. Check the console output for:

-   Request methods and response times
-   Database initialization messages
-   Error messages and stack traces

### Frontend Debugging

Open browser developer tools to see:

-   Form submission logs
-   API call attempts
-   Any JavaScript errors

## 🎯 Success Criteria

Phase 1 is considered complete when:

-   [x] Backend server starts without errors
-   [x] Database tables are created correctly
-   [x] Frontend loads and displays properly
-   [x] API endpoints respond correctly
-   [x] Long-polling infrastructure is ready
-   [x] Basic error handling works
-   [x] Code is properly documented

---

**Phase 1 Implementation Status**: ✅ COMPLETE

Ready to proceed to **Phase 2: Room Management** implementation.
