use leptos::*;

#[component]
pub fn JoinModal<F>(on_join: F) -> impl IntoView
where
    F: Fn(String) + 'static,
{
    let (username, set_username) = create_signal(String::new());
    let (error, set_error) = create_signal(None::<String>);

    let handle_submit = move |ev: leptos::ev::SubmitEvent| {
        ev.prevent_default();
        
        let name = username.get().trim().to_string();
        if name.is_empty() {
            set_error.set(Some("Please enter a username".to_string()));
            return;
        }
        
        if name.len() > 20 {
            set_error.set(Some("Username must be 20 characters or less".to_string()));
            return;
        }
        
        set_error.set(None);
        on_join(name);
    };

    view! {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
                <h2 class="text-2xl font-bold text-center mb-6 text-red-500">
                    "🎵 Join YouTube Together"
                </h2>
                
                <form on:submit=handle_submit>
                    <div class="mb-4">
                        <label 
                            for="username" 
                            class="block text-sm font-medium text-gray-300 mb-2"
                        >
                            "Choose your username:"
                        </label>
                        <input
                            type="text"
                            id="username"
                            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Enter your username..."
                            prop:value=username
                            on:input=move |ev| {
                                set_username.set(event_target_value(&ev));
                                set_error.set(None);
                            }
                            maxlength="20"
                        />
                    </div>

                    // Error message
                    <Show when=move || error.get().is_some()>
                        <div class="mb-4 text-red-400 text-sm">
                            {move || error.get().unwrap_or_default()}
                        </div>
                    </Show>

                    <button
                        type="submit"
                        class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                        disabled=move || username.get().trim().is_empty()
                    >
                        "Join Room"
                    </button>
                </form>

                <div class="mt-6 text-center text-sm text-gray-400">
                    "Watch YouTube videos together in real-time!"
                </div>
            </div>
        </div>
    }
} 