
# Technical Plan: Deno Radio Station Web App

## 1. System Architecture Overview

The Deno Radio Station web application will be built using Deno.js, leveraging the Fresh framework for server-side rendering and routing, and Deno KV for persistent data storage. Real-time communication will be achieved through long polling to provide an interactive experience for users in a single radio room. YouTube will serve as the primary source for video and audio content.

### High-Level Components:

*   **Fresh Framework (Deno.js):** Handles server-side rendering, routing, and API endpoints.
*   **Deno KV:** NoSQL key-value database for storing application data such as user information, video request queues, and playback state.
*   **YouTube Data API:** Used to search for and retrieve information about YouTube videos.
*   **Long Polling:** Mechanism for real-time updates to connected clients.
*   **Web Audio API / HTML5 Video:** For client-side playback of YouTube content.

### Data Flow:

1.  **User Joins:** A user accesses the web app, enters a name, and joins the single radio room.
2.  **Video Request:** Users can request YouTube videos. This request is sent to the Deno backend.
3.  **Backend Processing:** The backend validates the request, interacts with the YouTube Data API to get video information, and updates the Deno KV database with the new video in the queue.
4.  **Real-time Updates (Long Polling):** The backend notifies all connected clients about changes in the video queue or playback state via long polling.
5.  **Client Playback:** Clients receive updates and play the requested video in either 


video mode (displaying the video) or radio mode (audio only).

## 2. Database Schema and Data Models (Deno KV)

Deno KV is a key-value store, so data will be structured as key-value pairs. We will define prefixes for different data types to organize and query data efficiently.

### Data Models:

*   **Users:**
    *   Key: `users:{userId}`
    *   Value: `{ id: string, name: string, joinedAt: Date }`
*   **Current Room State:**
    *   Key: `room:state`
    *   Value: `{ currentVideoId: string | null, playbackTime: number, mode: 'video' | 'radio', lastUpdated: Date }`
*   **Video Queue:**
    *   Key: `queue:{timestamp}:{videoId}` (timestamp for ordering)
    *   Value: `{ videoId: string, title: string, requestedBy: string, duration: number, thumbnail: string }`
*   **Playback History:**
    *   Key: `history:{timestamp}:{videoId}`
    *   Value: `{ videoId: string, title: string, playedAt: Date }`

## 3. API Endpoints and Real-time Communication Strategy

### API Endpoints (Fresh Routes):

*   **`GET /`:** Serves the main application page.
*   **`POST /join`:** Allows a user to join the room. Expects `name` in the request body. Returns a user ID.
*   **`POST /request-video`:** Allows a user to request a YouTube video. Expects `videoId` and `userId` in the request body. The backend will validate the video and add it to the queue.
*   **`GET /current-state`:** Returns the current room state (current video, playback time, mode, queue). This will be the long-polling endpoint.
*   **`POST /update-mode`:** Allows an admin (or current player) to switch between 'video' and 'radio' mode. Expects `mode` in the request body.

### Real-time Communication (Long Polling):

1.  **Client Request:** Clients will make a `GET` request to `/current-state`.
2.  **Server Hold:** The server will hold the connection open until there's a change in the room state (new video in queue, mode change, video change) or a timeout occurs (e.g., 25 seconds).
3.  **Server Response:** When a change occurs or timeout is reached, the server responds with the latest room state.
4.  **Client Re-request:** Upon receiving a response, the client immediately makes a new request to `/current-state` to maintain the long-polling connection.
5.  **Event-driven Updates:** The server will use Deno KV's `watch` feature (if available and suitable for this use case, otherwise manual checks) or an in-memory event emitter to detect changes and trigger responses to held long-polling connections.

## 4. Frontend Components and User Interface Structure

The frontend will be built using Fresh's Preact components. The UI will be responsive and focus on simplicity.

### Key Components:

*   **Join Room Form:** A simple input field for the user's name to join the room.
*   **Current Playback Display:** Shows the title and thumbnail of the currently playing video. Includes controls for playback (play/pause, seek - if applicable).
*   **Video Player / Audio Player:** Dynamically renders either an embedded YouTube video player (for video mode) or just plays the audio (for radio mode).
*   **Video Request Input:** A search bar for users to find and request YouTube videos.
*   **Video Queue List:** Displays the list of upcoming videos in the queue.
*   **User List (Optional):** Shows who is currently in the room.
*   **Mode Switcher (Admin/Host Only):** A button or toggle to switch between 'video' and 'radio' mode.

### UI Flow:

1.  **Landing Page:** User sees a simple form to enter their name.
2.  **Radio Room:** After joining, the user is directed to the main radio room interface, which displays the current video/audio, queue, and request input.

## 5. Implementation Roadmap and Technical Specifications

### Phase 1: Core Setup and User Joining
*   Initialize Fresh project.
*   Implement `/` route for the join form.
*   Implement `/join` API endpoint to handle user names and store in Deno KV.
*   Set up basic Deno KV integration.

### Phase 2: Video Request and Queue Management
*   Integrate YouTube Data API for video search.
*   Implement `/request-video` API endpoint to add videos to Deno KV queue.
*   Develop frontend component for video search and request.
*   Display video queue on the frontend.

### Phase 3: Real-time Playback and Long Polling
*   Implement `/current-state` long-polling endpoint.
*   Develop client-side logic to consume long-polling updates and manage video playback (YouTube embedded player).
*   Implement 'video' and 'radio' mode switching via `/update-mode` endpoint and corresponding frontend logic.
*   Synchronize playback across clients using `playbackTime` from `room:state`.

### Phase 4: Enhancements and Refinements
*   Add basic error handling and input validation.
*   Improve UI/UX for a smoother experience.
*   Consider adding a simple chat feature (though not explicitly requested, it's a common radio app feature).
*   Implement basic user authentication/session management (e.g., using cookies for user ID).

## 6. Deliver Comprehensive Technical Plan Document

This document serves as the comprehensive technical plan. Once all sections are detailed and reviewed, it will be considered complete.


