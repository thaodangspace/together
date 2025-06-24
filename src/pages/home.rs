use crate::components::{Chat, JoinModal, Queue, UserList, VideoPlayer};
#[cfg(feature = "ssr")]
use crate::server::functions::join_room;
#[cfg(not(feature = "ssr"))]
use crate::client_api::join_room;
use gloo_net::http::Request;
use gloo_timers::future::TimeoutFuture;
use leptos::logging;
use leptos::spawn_local;
use leptos::*;
use serde::Deserialize;

#[component]
pub fn Home() -> impl IntoView {
    let (user_id, set_user_id) = create_signal(None::<String>);
    let (username, set_username) = create_signal(None::<String>);
    let (joined, set_joined) = create_signal(false);

    // Video playback state
    let (current_video, set_current_video) = create_signal(None::<String>);
    let (is_playing, set_is_playing) = create_signal(false);
    let (current_position, set_current_position) = create_signal(0.0);

    #[derive(Deserialize)]
    struct VideoUpdate {
        video_id: Option<String>,
        is_playing: bool,
        current_position: f64,
    }

    create_effect(move |_| {
        if joined.get() {
            let set_current_video = set_current_video.clone();
            let set_is_playing = set_is_playing.clone();
            let set_current_position = set_current_position.clone();
            spawn_local(async move {
                loop {
                    match Request::get("/longpoll").send().await {
                        Ok(resp) => {
                            if resp.status() == 200 {
                                if let Ok(event) = resp.json::<crate::types::Event>().await {
                                    if event.event_type == "video_update" {
                                        if let Ok(update) =
                                            serde_json::from_value::<VideoUpdate>(event.data)
                                        {
                                            set_current_video.set(update.video_id);
                                            set_is_playing.set(update.is_playing);
                                            set_current_position.set(update.current_position);
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => logging::log!("longpoll error: {:?}", e),
                    }
                    gloo_timers::future::TimeoutFuture::new(100).await;
                }
            });
        }
    });

    view! {
        <div class="min-h-screen bg-gray-900 text-white">
            // Show join modal if not joined
            <Show when=move || !joined.get()>
                <JoinModal
                    on_join=move |name: String| {
                        let set_user_id = set_user_id.clone();
                        let set_username = set_username.clone();
                        let set_joined = set_joined.clone();
                        spawn_local(async move {
                            match join_room(name).await {
                                Ok(resp) => {
                                    set_user_id.set(Some(resp.user_id));
                                    set_username.set(Some(resp.username));
                                    set_joined.set(true);
                                }
                                Err(e) => logging::log!("join failed: {:?}", e),
                            }
                        });
                    }
                />
            </Show>

            // Main app interface
            <Show when=move || joined.get()>
                <div class="flex h-screen">
                    // Main content area
                    <div class="flex-1 flex flex-col">
                        // Header
                        <header class="bg-gray-800 p-4 border-b border-gray-700">
                            <div class="flex justify-between items-center">
                                <h1 class="text-2xl font-bold text-red-500">
                                    "🎵 YouTube Together"
                                </h1>
                                <div class="text-sm text-gray-300">
                                    "Welcome, " {move || username.get().unwrap_or_default()}
                                </div>
                            </div>
                        </header>

                        // Video player area
                        <div class="flex-1 p-6">
                            <div class="max-w-4xl mx-auto">
                                <VideoPlayer
                                    video_id=current_video
                                    is_playing=is_playing
                                    current_position=current_position
                                    on_play=move |pos| {
                                        logging::log!("Play at position: {}", pos);
                                    }
                                    on_pause=move |pos| {
                                        logging::log!("Pause at position: {}", pos);
                                    }
                                    on_seek=move |pos| {
                                        logging::log!("Seek to position: {}", pos);
                                    }
                                />
                            </div>
                        </div>

                        // Queue section
                        <div class="p-6 border-t border-gray-700">
                            <Queue/>
                        </div>
                    </div>

                    // Sidebar
                    <div class="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                        // User list
                        <div class="p-4 border-b border-gray-700">
                            <UserList/>
                        </div>

                        // Chat
                        <div class="flex-1">
                            <Chat user_id=user_id username=username/>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    }
}
