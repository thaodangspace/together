# SyncWatch Prototype

This repository contains a minimal prototype inspired by the Vietnamese design document in `docs/`.
It implements a small tRPC backend and a simple React page for testing.

## Structure

- `backend` – Node.js server with Express and tRPC.
- `frontend` – simple static page using React.
- `docs` – project specification and architecture document.

## Running the server

```bash
cd backend
npm install
node server.js
```

Then open `frontend/index.html` in your browser and click **Create Room** to test.
