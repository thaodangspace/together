use leptos::*;

#[component]
pub fn Chat(
    user_id: ReadSignal<Option<String>>,
    username: ReadSignal<Option<String>>,
) -> impl IntoView {
    let (message_text, set_message_text) = create_signal(String::new());
    let (messages, set_messages) = create_signal(Vec::<ChatMessage>::new());

    #[derive(Clone, Debug)]
    struct ChatMessage {
        id: i32,
        username: String,
        content: String,
        timestamp: String,
        is_system: bool,
    }

    // Add welcome message on mount
    create_effect(move |_| {
        if let Some(name) = username.get() {
            let welcome_msg = ChatMessage {
                id: 0,
                username: "System".to_string(),
                content: format!("{} joined the room!", name),
                timestamp: "now".to_string(),
                is_system: true,
            };
            set_messages.update(|msgs| msgs.insert(0, welcome_msg));
        }
    });

    let handle_send_message = move |ev: leptos::ev::SubmitEvent| {
        ev.prevent_default();
        
        let content = message_text.get().trim().to_string();
        if content.is_empty() {
            return;
        }

        let new_message = ChatMessage {
            id: messages.get().len() as i32 + 1,
            username: username.get().unwrap_or_default(),
            content,
            timestamp: "now".to_string(),
            is_system: false,
        };

        set_messages.update(|msgs| msgs.insert(0, new_message));
        set_message_text.set(String::new());
    };

    view! {
        <div class="flex flex-col h-full">
            <div class="p-4 border-b border-gray-700">
                <h3 class="text-lg font-bold text-white">"💬 Chat"</h3>
            </div>

            // Messages area
            <div class="flex-1 overflow-y-auto p-4 space-y-3">
                <Show
                    when=move || !messages.get().is_empty()
                    fallback=|| view! {
                        <div class="text-center text-gray-400 py-8">
                            <div class="text-3xl mb-2">"💬"</div>
                            <p class="text-sm">"No messages yet"</p>
                            <p class="text-xs mt-1">"Start a conversation!"</p>
                        </div>
                    }
                >
                    <For
                        each=move || messages.get()
                        key=|msg| msg.id
                        children=move |msg| {
                            view! {
                                <div class=format!(
                                    "p-3 rounded-lg {}",
                                    if msg.is_system {
                                        "bg-blue-900/30 border border-blue-700/50"
                                    } else {
                                        "bg-gray-700"
                                    }
                                )>
                                    <div class="flex items-start justify-between">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-1">
                                                <span class=format!(
                                                    "font-medium text-sm {}",
                                                    if msg.is_system { "text-blue-300" } else { "text-white" }
                                                )>
                                                    {msg.username}
                                                </span>
                                                <span class="text-xs text-gray-400">
                                                    {msg.timestamp}
                                                </span>
                                            </div>
                                            <p class="text-sm text-gray-200">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            }
                        }
                    />
                </Show>
            </div>

            // Message input
            <div class="p-4 border-t border-gray-700">
                <form on:submit=handle_send_message>
                    <div class="flex gap-2">
                        <input
                            type="text"
                            class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Type a message..."
                            prop:value=message_text
                            on:input=move |ev| set_message_text.set(event_target_value(&ev))
                            maxlength="500"
                        />
                        <button
                            type="submit"
                            class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
                            disabled=move || message_text.get().trim().is_empty()
                        >
                            "Send"
                        </button>
                    </div>
                </form>
                <div class="text-xs text-gray-400 mt-2">
                    "Tip: Paste YouTube links to add them to the queue!"
                </div>
            </div>
        </div>
    }
} 