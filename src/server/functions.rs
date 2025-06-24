// Server functions will be implemented here
// This file will contain Leptos server functions for:
// - User management (join_room, get_room_state)
// - Video controls (play_video, pause_video, seek_video)
// - Queue management (add_to_queue, remove_from_queue)
// - Chat functions (send_message, get_messages)

use leptos::*;
use crate::types::*;

// Placeholder - will be implemented in Phase 2
#[server(JoinRoom, "/api")]
pub async fn join_room(username: String) -> Result<JoinResponse, ServerFnError> {
    // TODO: Implement user join functionality
    Err(ServerFnError::ServerError("Not implemented yet".to_string()))
} 