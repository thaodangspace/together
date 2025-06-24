// Server functions for the application
// Handles user management and room state retrieval

use leptos::*;
use sqlx::{self};
use uuid::Uuid;
use crate::types::*;
use crate::server::state::AppState;

#[server(JoinRoom, "/api")]
pub async fn join_room(username: String) -> Result<JoinResponse, ServerFnError> {
    let app_state = expect_context::<AppState>();
    let user_id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO users (id, username, is_online) VALUES (?, ?, TRUE)"
    )
        .bind(&user_id)
        .bind(&username)
        .execute(&app_state.db)
        .await?;

    let room_state = get_room_state().await?;

    Ok(JoinResponse {
        user_id,
        username,
        room_state,
    })
}

#[server(GetRoomState, "/api")]
pub async fn get_room_state() -> Result<RoomState, ServerFnError> {
    let app_state = expect_context::<AppState>();

    let current_video = sqlx::query_as::<_, VideoState>(
        "SELECT * FROM room_state WHERE id = 1"
    )
    .fetch_optional(&app_state.db)
    .await?;

    let queue = sqlx::query_as::<_, QueueItem>(
        "SELECT * FROM queue ORDER BY position"
    )
    .fetch_all(&app_state.db)
    .await?;

    let users = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE is_online = TRUE"
    )
    .fetch_all(&app_state.db)
    .await?;

    let messages = sqlx::query_as::<_, Message>(
        "SELECT * FROM messages ORDER BY created_at DESC LIMIT 50"
    )
    .fetch_all(&app_state.db)
    .await?;

    Ok(RoomState {
        current_video,
        queue,
        users,
        messages,
    })
}
