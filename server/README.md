# SyncWatch Backend Server

A Deno.js backend server for synchronized YouTube video watching with real-time communication using Long-Polling.

## Features

-   **Room Management**: Create and join video rooms
-   **Video Synchronization**: Real-time video state sync across all users
-   **Queue System**: Add, remove, and reorder videos in queue
-   **Chat System**: Real-time messaging within rooms
-   **YouTube Integration**: Automatic video info retrieval from YouTube API
-   **Long-Polling**: Real-time updates without WebSockets

## Project Structure

```
server/
├── server.ts                 # Main server file
├── database/
│   └── connection.ts         # SQLite database management
├── longpoll/
│   └── manager.ts           # Long-polling connection manager
├── routes/
│   └── longpoll.ts          # Long-polling endpoints
├── services/
│   └── YouTubeService.ts    # YouTube API integration
├── trpc/
│   ├── context.ts           # tRPC context
│   └── router.ts            # tRPC procedures (for future use)
├── utils/
│   └── logger.ts            # Logging utility
└── env.example              # Environment variables template
```

## Setup

1. **Copy environment file:**

    ```bash
    cp env.example .env
    ```

2. **Configure environment variables:**

    ```bash
    # Server Configuration
    PORT=8000
    NODE_ENV=development

    # Database
    DATABASE_URL=./syncwatch.db

    # YouTube API (optional but recommended)
    YOUTUBE_API_KEY=your_youtube_api_key_here

    # CORS
    CORS_ORIGIN=http://localhost:3000

    # Logging
    LOG_LEVEL=info
    ```

3. **Start the server:**
    ```bash
    deno task server:dev  # Development with watch mode
    # or
    deno task server:start  # Production mode
    ```

## API Endpoints

### Room Management

-   **POST** `/api/rooms` - Create a new room
-   **POST** `/api/rooms/:roomId/join` - Join an existing room

### Video Control

-   **POST** `/api/rooms/:roomId/video/state` - Update video state (play/pause/seek)

### Queue Management

-   **POST** `/api/rooms/:roomId/queue` - Add video to queue

### Chat

-   **POST** `/api/rooms/:roomId/messages` - Send a message
-   **GET** `/api/rooms/:roomId/messages` - Get message history

### Real-time Communication

-   **GET** `/api/rooms/:roomId/poll?userId=:userId` - Long-polling endpoint for real-time updates

### Health Check

-   **GET** `/health` - Server health status

## Usage Example

### Create a Room

```bash
curl -X POST http://localhost:8000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "My Room", "username": "John"}'
```

### Join a Room

```bash
curl -X POST http://localhost:8000/api/rooms/{roomId}/join \
  -H "Content-Type: application/json" \
  -d '{"username": "Jane"}'
```

### Add Video to Queue

```bash
curl -X POST http://localhost:8000/api/rooms/{roomId}/queue \
  -H "Content-Type: application/json" \
  -d '{"userId": "{userId}", "videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Send Chat Message

```bash
curl -X POST http://localhost:8000/api/rooms/{roomId}/messages \
  -H "Content-Type: application/json" \
  -d '{"userId": "{userId}", "content": "Hello everyone!"}'
```

## Real-time Events

The Long-Polling system sends the following event types:

-   `user_joined` - When a user joins the room
-   `user_left` - When a user leaves the room
-   `video_state_changed` - When video play/pause/seek state changes
-   `current_video_changed` - When the current video changes
-   `queue_updated` - When the queue is modified
-   `new_message` - When a new chat message is sent

## Database Schema

The server uses SQLite with the following tables:

-   **rooms** - Video rooms
-   **users** - Room participants
-   **queue** - Video queue for each room
-   **messages** - Chat messages

## YouTube Integration

The server integrates with YouTube Data API v3 to:

-   Validate YouTube URLs
-   Extract video information (title, duration, thumbnail)
-   Cache video metadata for performance

## Long-Polling Architecture

Instead of WebSockets, the server uses Long-Polling for real-time communication:

1. Frontend sends a request to `/api/rooms/:roomId/poll`
2. Server holds the request open for up to 25 seconds
3. When an event occurs, server responds immediately with the event data
4. Frontend immediately sends a new long-poll request
5. This provides real-time updates with simple HTTP requests

## Development

The server is built with:

-   **Deno.js** - Modern JavaScript/TypeScript runtime
-   **Oak** - Web framework for Deno
-   **SQLite** - Lightweight database
-   **Zod** - Schema validation
-   **YouTube Data API v3** - Video metadata

## Error Handling

The server includes comprehensive error handling:

-   Request validation
-   Database error handling
-   YouTube API error handling
-   Long-polling timeout management
-   Graceful degradation when YouTube API is unavailable

## Logging

Structured JSON logging with configurable levels:

-   DEBUG - Detailed debug information
-   INFO - General information
-   WARN - Warning messages
-   ERROR - Error messages with stack traces

## Security Features

-   CORS configuration
-   Input validation with Zod schemas
-   SQL injection prevention with parameterized queries
-   Request rate limiting (can be added)
-   Environment-based configuration

## Future Enhancements

-   User authentication with JWT
-   Room permissions and moderation
-   Video source expansion beyond YouTube
-   Horizontal scaling with Redis
-   WebSocket upgrade option
-   Metrics and monitoring endpoints
