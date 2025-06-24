use leptos::*;

#[component]
pub fn Queue() -> impl IntoView {
    let (new_url, set_new_url) = create_signal(String::new());
    let (queue_items, set_queue_items) = create_signal(Vec::<QueueItem>::new());

    // Mock queue item for display
    #[derive(Clone, Debug)]
    struct QueueItem {
        id: i32,
        title: String,
        url: String,
        duration: String,
        added_by: String,
    }

    let handle_add_video = move |ev: leptos::ev::SubmitEvent| {
        ev.prevent_default();
        
        let url = new_url.get().trim().to_string();
        if url.is_empty() {
            return;
        }

        // Mock adding to queue
        let new_item = QueueItem {
            id: queue_items.get().len() as i32 + 1,
            title: "Sample Video".to_string(),
            url: url.clone(),
            duration: "3:45".to_string(),
            added_by: "You".to_string(),
        };

        set_queue_items.update(|items| items.push(new_item));
        set_new_url.set(String::new());
    };

    view! {
        <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-bold mb-4 text-white">"🎵 Queue"</h3>
            
            // Add video form
            <form on:submit=handle_add_video class="mb-6">
                <div class="flex gap-2">
                    <input
                        type="text"
                        class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Paste YouTube URL here..."
                        prop:value=new_url
                        on:input=move |ev| set_new_url.set(event_target_value(&ev))
                    />
                    <button
                        type="submit"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                        disabled=move || new_url.get().trim().is_empty()
                    >
                        "Add to Queue"
                    </button>
                </div>
            </form>

            // Queue list
            <div class="space-y-3">
                <Show
                    when=move || !queue_items.get().is_empty()
                    fallback=|| view! {
                        <div class="text-center py-8 text-gray-400">
                            <div class="text-4xl mb-2">"📝"</div>
                            <p>"No videos in queue"</p>
                            <p class="text-sm mt-1">"Add a YouTube video to get started!"</p>
                        </div>
                    }
                >
                    <For
                        each=move || queue_items.get()
                        key=|item| item.id
                        children=move |item| {
                            view! {
                                <div class="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                                    <div class="flex-1">
                                        <h4 class="font-medium text-white">{item.title}</h4>
                                        <p class="text-sm text-gray-300">
                                            "Added by " {item.added_by} " • " {item.duration}
                                        </p>
                                        <p class="text-xs text-gray-400 truncate">{item.url}</p>
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded">
                                            "Play Now"
                                        </button>
                                        <button class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded">
                                            "Remove"
                                        </button>
                                    </div>
                                </div>
                            }
                        }
                    />
                </Show>
            </div>

            // Queue stats
            <div class="mt-4 text-sm text-gray-400 text-center">
                {move || {
                    let count = queue_items.get().len();
                    if count == 0 {
                        "Queue is empty".to_string()
                    } else if count == 1 {
                        "1 video in queue".to_string()
                    } else {
                        format!("{} videos in queue", count)
                    }
                }}
            </div>
        </div>
    }
} 