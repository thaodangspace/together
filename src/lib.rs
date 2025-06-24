use leptos::*;
use leptos_meta::*;
use leptos_router::*;

mod components;
mod pages;
mod types;

#[cfg(feature = "ssr")]
pub mod server;

use crate::pages::Home;

#[component]
pub fn App() -> impl IntoView {
    provide_meta_context();

    view! {
        <Stylesheet id="leptos" href="/pkg/youtube-together.css"/>
        <Title text="YouTube Together"/>
        <Meta name="description" content="Watch YouTube videos together in real-time"/>

        <Router>
            <main class="min-h-screen bg-gray-900 text-white">
                <Routes>
                    <Route path="" view=Home/>
                </Routes>
            </main>
        </Router>
    }
} 