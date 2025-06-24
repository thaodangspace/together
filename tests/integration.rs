use youtube_together::server::{functions::join_room, state::AppState};
use leptos::*;

#[tokio::test]
async fn test_join_room_inserts_user() {
    std::env::set_var("DATABASE_URL", "sqlite::memory:");
    let state = AppState::new().await.expect("create state");
    let runtime = leptos::create_runtime();
    provide_context(state.clone());

    let resp = join_room("Alice".to_string()).await.expect("join");
    assert_eq!(resp.username, "Alice");
    assert_eq!(resp.room_state.users.len(), 1);
    runtime.dispose();
}
