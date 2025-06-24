use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub is_online: bool,
    pub joined_at: DateTime<Utc>,
    pub last_seen: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueItem {
    pub id: i32,
    pub video_id: String,
    pub video_url: String,
    pub video_title: Option<String>,
    pub video_duration: Option<i32>,
    pub video_thumbnail: Option<String>,
    pub added_by: String,
    pub position: i32,
    pub added_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: i32,
    pub user_id: String,
    pub username: String,
    pub content: String,
    pub message_type: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoState {
    pub id: i32,
    pub current_video_id: Option<String>,
    pub current_video_url: Option<String>,
    pub current_video_title: Option<String>,
    pub current_video_duration: Option<i32>,
    pub current_position: f64,
    pub is_playing: bool,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoomState {
    pub current_video: Option<VideoState>,
    pub queue: Vec<QueueItem>,
    pub users: Vec<User>,
    pub messages: Vec<Message>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoinResponse {
    pub user_id: String,
    pub username: String,
    pub room_state: RoomState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub event_type: String,
    pub data: serde_json::Value,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YouTubeVideoInfo {
    pub title: String,
    pub duration: i32,
    pub thumbnail: String,
} 