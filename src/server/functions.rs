// Server functions for the application
// Handles user management and room state retrieval

use crate::server::state::AppState;
use crate::types::*;
use leptos::*;
use sqlx::{self};
use uuid::Uuid;

#[server(JoinRoom, "/api")]
pub async fn join_room(username: String) -> Result<JoinResponse, ServerFnError> {
    let app_state = expect_context::<AppState>();
    let user_id = uuid::Uuid::new_v4().to_string();

    sqlx::query("INSERT INTO users (id, username, is_online) VALUES (?, ?, TRUE)")
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

    let current_video = sqlx::query_as::<_, VideoState>("SELECT * FROM room_state WHERE id = 1")
        .fetch_optional(&app_state.db)
        .await?;

    let queue = sqlx::query_as::<_, QueueItem>("SELECT * FROM queue ORDER BY position")
        .fetch_all(&app_state.db)
        .await?;

    let users = sqlx::query_as::<_, User>("SELECT * FROM users WHERE is_online = TRUE")
        .fetch_all(&app_state.db)
        .await?;

    let messages =
        sqlx::query_as::<_, Message>("SELECT * FROM messages ORDER BY created_at DESC LIMIT 50")
            .fetch_all(&app_state.db)
            .await?;

    Ok(RoomState {
        current_video,
        queue,
        users,
        messages,
    })
}

#[server(UpdateVideoState, "/api")]
pub async fn update_video_state(
    video_id: Option<String>,
    video_url: Option<String>,
    video_title: Option<String>,
    video_duration: Option<i32>,
    current_position: f64,
    is_playing: bool,
) -> Result<(), ServerFnError> {
    use chrono::Utc;
    let app_state = expect_context::<AppState>();

    sqlx::query(
        "UPDATE room_state SET current_video_id = ?, current_video_url = ?, current_video_title = ?, current_video_duration = ?, current_position = ?, is_playing = ?, last_updated = CURRENT_TIMESTAMP WHERE id = 1",
    )
    .bind(&video_id)
    .bind(&video_url)
    .bind(&video_title)
    .bind(&video_duration)
    .bind(current_position)
    .bind(is_playing)
    .execute(&app_state.db)
    .await?;

    let event = Event {
        event_type: "video_update".to_string(),
        data: serde_json::json!({
            "video_id": video_id,
            "video_url": video_url,
            "video_title": video_title,
            "video_duration": video_duration,
            "current_position": current_position,
            "is_playing": is_playing,
        }),
        timestamp: Utc::now().timestamp(),
    };

    app_state.broadcast_event(event).await;

    Ok(())
}
