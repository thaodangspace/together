// Database operations will be implemented here
// This file will contain database queries and operations for:
// - User CRUD operations
// - Queue management
// - Message storage and retrieval
// - Room state management

#[cfg(feature = "ssr")]
use sqlx::{Pool, Sqlite};

#[cfg(feature = "ssr")]
use crate::types::{RoomState, User, VideoState, QueueItem, Message};

/// Convenience wrapper around the database connection pool.
#[cfg_attr(feature = "ssr", derive(Clone))]
pub struct DatabaseOperations {
    pub db: Pool<Sqlite>,
}

impl DatabaseOperations {
    /// Create a new [`DatabaseOperations`] instance.
    pub async fn new(db: Pool<Sqlite>) -> Self {
        Self { db }
    }

    /// Insert a new user into the database.
    pub async fn add_user(&self, id: &str, username: &str) -> Result<(), sqlx::Error> {
        sqlx::query("INSERT INTO users (id, username, is_online) VALUES (?, ?, TRUE)")
            .bind(id)
            .bind(username)
            .execute(&self.db)
            .await?;
        Ok(())
    }

    /// Fetch the current [`RoomState`].
    pub async fn get_room_state(&self) -> Result<RoomState, sqlx::Error> {
        let current_video = sqlx::query_as::<_, VideoState>("SELECT * FROM room_state WHERE id = 1")
            .fetch_optional(&self.db)
            .await?;

        let queue = sqlx::query_as::<_, QueueItem>("SELECT * FROM queue ORDER BY position")
            .fetch_all(&self.db)
            .await?;

        let users = sqlx::query_as::<_, User>("SELECT * FROM users WHERE is_online = TRUE")
            .fetch_all(&self.db)
            .await?;

        let messages = sqlx::query_as::<_, Message>("SELECT * FROM messages ORDER BY created_at DESC LIMIT 50")
            .fetch_all(&self.db)
            .await?;

        Ok(RoomState {
            current_video,
            queue,
            users,
            messages,
        })
    }
}
