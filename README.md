# 🎵 YouTube Together

A real-time collaborative YouTube viewing application built with [Leptos.dev](https://leptos.dev) fullstack framework.

## ✨ Features

-   **Single Shared Room**: All users join one unified shared room
-   **Real-time Video Synchronization**: Watch YouTube videos together with synchronized playback
-   **Queue Management**: Add, remove, and reorder videos in the shared queue
-   **Live Chat**: Chat with other users in real-time
-   **User Management**: See who's online and manage the room

## 🚀 Tech Stack

-   **Frontend**: Leptos.dev (Rust + WebAssembly)
-   **Backend**: Leptos.dev with Axum server
-   **Database**: SQLx with SQLite (development) / PostgreSQL (production)
-   **Real-time**: Server-Sent Events (SSE)
-   **Styling**: Tailwind CSS
-   **Build**: Trunk for frontend, Cargo for backend

## 🛠️ Development Setup

### Prerequisites

-   Rust (latest stable)
-   Node.js (for Tailwind CSS)

**System Dependencies (Linux/Ubuntu):**

```bash
sudo apt update
sudo apt install build-essential libssl-dev pkg-config
```

**System Dependencies (Fedora/RHEL):**

```bash
sudo dnf install openssl-devel pkg-config gcc
```

**System Dependencies (macOS):**

```bash
# Usually no additional packages needed
# If you encounter issues, install via Homebrew:
brew install openssl pkg-config
```

### Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd youtube-together
    ```

2. **Install dependencies**

    ```bash
    # Install Rust tools
    cargo install trunk
    rustup target add wasm32-unknown-unknown

    # Install Tailwind CSS (choose one method)
    # Method 1: Using npm (recommended)
    npm install -D tailwindcss

    # Method 2: Download standalone binary (if no Node.js)
    # Linux/macOS
    curl -sLO https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64
    chmod +x tailwindcss-linux-x64
    mv tailwindcss-linux-x64 tailwindcss
    ```

3. **Setup environment**

    ```bash
    cp env.example .env
    # Edit .env with your settings (YouTube API key, etc.)
    ```

4. **Run development server**

    ```bash
    # Terminal 1: Start Tailwind CSS watch
    # If using npm:
    npx tailwindcss -i ./style/tailwind.css -o ./target/site/tailwind.css --watch
    # If using standalone binary:
    # ./tailwindcss -i ./style/tailwind.css -o ./target/site/tailwind.css --watch

    # Terminal 2: Start frontend development server
    trunk serve

    # Terminal 3: Start backend server
    cargo run --bin server --features ssr
    ```

### Quick Build

Use the provided build script:

```bash
chmod +x build.sh
./build.sh
```

## 📁 Project Structure

```
youtube-together/
├── src/
│   ├── lib.rs                   # Main app component
│   ├── main.rs                  # Server entry point
│   ├── components/              # UI components
│   │   ├── join_modal.rs        # Join room modal
│   │   ├── video_player.rs      # YouTube player
│   │   ├── queue.rs             # Queue management
│   │   ├── chat.rs              # Chat interface
│   │   └── user_list.rs         # Online users
│   ├── pages/
│   │   └── home.rs              # Main room page
│   ├── server/                  # Server-side code
│   │   ├── state.rs             # App state management
│   │   ├── functions.rs         # Leptos server functions
│   │   ├── database.rs          # Database operations
│   │   ├── youtube.rs           # YouTube API integration
│   │   └── events.rs            # SSE event handling
│   └── types/
│       └── models.rs            # Shared data types
├── migrations/                  # Database migrations
├── style/                       # CSS/SCSS files
├── public/                      # Static assets
└── docs/                        # Documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
DATABASE_URL=sqlite:./database.db
YOUTUBE_API_KEY=your_youtube_api_key_here
RUST_LOG=info
LEPTOS_SITE_ADDR=0.0.0.0:3000
LEPTOS_SITE_ROOT=target/site
```

### YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create API credentials (API Key)
5. Add the API key to your `.env` file

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM rust:1.75 as builder

RUN cargo install trunk
RUN rustup target add wasm32-unknown-unknown

WORKDIR /app
COPY . .

RUN trunk build --release
RUN cargo build --release --bin server --features ssr

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates sqlite3

WORKDIR /app
COPY --from=builder /app/target/release/server ./
COPY --from=builder /app/target/site ./target/site
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["./server"]
```

### Manual Deployment

1. Build the application:

    ```bash
    ./build.sh
    ```

2. Copy files to server:

    - `target/release/server` (binary)
    - `target/site/` (frontend assets)
    - `public/` (static files)
    - `migrations/` (database migrations)

3. Run on server:
    ```bash
    ./server
    ```

## 📋 Development Phases

### ✅ Phase 1: Project Setup

-   [x] Leptos project initialization
-   [x] Database schema and migrations
-   [x] Basic project structure
-   [x] Tailwind CSS integration

### 🔄 Phase 2: Core Functionality (In Progress)

-   [ ] Server functions implementation
-   [ ] User join functionality
-   [ ] Basic room state management
-   [ ] Server-Sent Events setup

### 📅 Phase 3: Video Player

-   [ ] YouTube IFrame API integration
-   [ ] Video control synchronization
-   [ ] YouTube metadata fetching

### 📅 Phase 4: Queue Management

-   [ ] Queue CRUD operations
-   [ ] Drag and drop functionality
-   [ ] Auto-play next video

### 📅 Phase 5: Chat System

-   [ ] Real-time messaging
-   [ ] Message history
-   [ ] YouTube link detection

### 📅 Phase 6: Polish & Deploy

-   [ ] UI/UX improvements
-   [ ] Performance optimization
-   [ ] Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `cargo test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

-   [Leptos.dev](https://leptos.dev) for the amazing fullstack framework
-   [YouTube](https://youtube.com) for the IFrame API
-   [Tailwind CSS](https://tailwindcss.com) for the styling framework
