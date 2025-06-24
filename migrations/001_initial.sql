-- Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,                 -- User UUID
    username TEXT NOT NULL,              -- Display name
    is_online BOOLEAN DEFAULT TRUE,      -- Online status
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Queue Table
CREATE TABLE queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT NOT NULL,              -- YouTube video ID
    video_url TEXT NOT NULL,             -- YouTube video URL
    video_title TEXT,                    -- Video title
    video_duration INTEGER,              -- Video duration (seconds)
    video_thumbnail TEXT,                -- Thumbnail URL
    added_by TEXT NOT NULL,              -- User ID who added video
    position INTEGER NOT NULL,           -- Position in queue
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages Table
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,               -- Sender ID
    username TEXT NOT NULL,              -- Sender name (to avoid joins)
    content TEXT NOT NULL,               -- Message content
    message_type TEXT DEFAULT 'text',    -- Message type: 'text', 'video_link', 'system'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Room State Table
CREATE TABLE room_state (
    id INTEGER PRIMARY KEY DEFAULT 1,    -- Always 1 since only one room
    current_video_id TEXT,               -- Current YouTube video ID
    current_video_url TEXT,              -- Current YouTube video URL
    current_video_title TEXT,            -- Current video title
    current_video_duration INTEGER,      -- Video duration (seconds)
    current_position REAL,               -- Current video position (seconds)
    is_playing BOOLEAN DEFAULT FALSE,    -- Video playback state
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial room state
INSERT INTO room_state (id) VALUES (1); 