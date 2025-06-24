use leptos::*;

#[component]
pub fn VideoPlayer<F1, F2, F3>(
    video_id: ReadSignal<Option<String>>,
    is_playing: ReadSignal<bool>,
    current_position: ReadSignal<f64>,
    on_play: F1,
    on_pause: F2,
    on_seek: F3,
) -> impl IntoView
where
    F1: Fn(f64) + 'static,
    F2: Fn(f64) + 'static,
    F3: Fn(f64) + 'static,
{
    view! {
        <div class="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            // Placeholder for YouTube player
            <Show
                when=move || video_id.get().is_some()
                fallback=|| view! {
                    <div class="flex items-center justify-center h-full">
                        <div class="text-center text-gray-400">
                            <div class="text-6xl mb-4">"🎵"</div>
                            <h3 class="text-xl font-medium mb-2">"No video playing"</h3>
                            <p class="text-sm">"Add a YouTube video to the queue to get started!"</p>
                        </div>
                    </div>
                }
            >
                <div class="flex items-center justify-center h-full bg-gray-800">
                    <div class="text-center text-white">
                        <div class="text-4xl mb-4">"📺"</div>
                        <p class="text-lg">"YouTube Player will be here"</p>
                        <p class="text-sm text-gray-300 mt-2">
                            "Video ID: " {move || video_id.get().unwrap_or_default()}
                        </p>
                    </div>
                </div>
            </Show>

            // Player controls overlay
            <div class="absolute bottom-4 left-4 right-4 flex items-center gap-4 bg-black/50 rounded p-3">
                <button
                    class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    on:click=move |_| {
                        if is_playing.get() {
                            on_pause(current_position.get());
                        } else {
                            on_play(current_position.get());
                        }
                    }
                >
                    {move || if is_playing.get() { "⏸️ Pause" } else { "▶️ Play" }}
                </button>

                <div class="flex-1">
                    <div class="text-sm text-white">
                        "Position: " {move || format!("{:.1}s", current_position.get())}
                    </div>
                    <div class="text-xs text-gray-300">
                        "Status: " {move || if is_playing.get() { "Playing" } else { "Paused" }}
                    </div>
                </div>

                <button
                    class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                    on:click=move |_| on_seek(0.0)
                >
                    "↻ Restart"
                </button>
            </div>
        </div>
    }
} 