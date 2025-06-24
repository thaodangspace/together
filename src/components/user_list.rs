use leptos::*;

#[component]
pub fn UserList() -> impl IntoView {
    let (users, set_users) = create_signal(Vec::<OnlineUser>::new());

    #[derive(Clone, Debug)]
    struct OnlineUser {
        id: String,
        username: String,
        joined_at: String,
        is_self: bool,
    }

    // Mock users for initial display
    create_effect(move |_| {
        let mock_users = vec![
            OnlineUser {
                id: "1".to_string(),
                username: "You".to_string(),
                joined_at: "now".to_string(),
                is_self: true,
            },
            OnlineUser {
                id: "2".to_string(),
                username: "MusicLover22".to_string(),
                joined_at: "2 min ago".to_string(),
                is_self: false,
            },
            OnlineUser {
                id: "3".to_string(),
                username: "VideoFan".to_string(),
                joined_at: "5 min ago".to_string(),
                is_self: false,
            },
        ];
        set_users.set(mock_users);
    });

    view! {
        <div>
            <h3 class="text-lg font-bold text-white mb-4">
                "👥 Online Users"
            </h3>

            <div class="space-y-2">
                <For
                    each=move || users.get()
                    key=|user| user.id.clone()
                    children=move |user| {
                        view! {
                            <div class=format!(
                                "flex items-center gap-3 p-2 rounded {}",
                                if user.is_self {
                                    "bg-red-900/30 border border-red-700/50"
                                } else {
                                    "bg-gray-700/50"
                                }
                            )>
                                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div class="flex-1">
                                    <div class=format!(
                                        "font-medium text-sm {}",
                                        if user.is_self { "text-red-300" } else { "text-white" }
                                    )>
                                        {user.username.clone()}
                                        {if user.is_self { " (You)" } else { "" }}
                                    </div>
                                    <div class="text-xs text-gray-400">
                                        "Joined " {user.joined_at}
                                    </div>
                                </div>
                            </div>
                        }
                    }
                />
            </div>

            <div class="mt-4 text-xs text-gray-400 text-center">
                {move || {
                    let count = users.get().len();
                    if count == 1 {
                        "1 user online".to_string()
                    } else {
                        format!("{} users online", count)
                    }
                }}
            </div>

            // Connection status
            <div class="mt-3 flex items-center gap-2 text-xs">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span class="text-green-400">"Connected"</span>
            </div>
        </div>
    }
} 