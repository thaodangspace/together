use leptos::*;
use crate::components::{JoinModal, VideoPlayer, Queue, Chat, UserList};

#[component]
pub fn Home() -> impl IntoView {
    let (user_id, set_user_id) = create_signal(None::<String>);
    let (username, set_username) = create_signal(None::<String>);
    let (joined, set_joined) = create_signal(false);

    // Mock state for initial development
    let (current_video, _set_current_video) = create_signal(None::<String>);
    let (is_playing, _set_is_playing) = create_signal(false);
    let (current_position, _set_current_position) = create_signal(0.0);

    view! {
        <div class="min-h-screen bg-gray-900 text-white">
            // Show join modal if not joined
            <Show when=move || !joined.get()>
                <JoinModal
                    on_join=move |name: String| {
                        let user_id = uuid::Uuid::new_v4().to_string();
                        set_user_id.set(Some(user_id));
                        set_username.set(Some(name));
                        set_joined.set(true);
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