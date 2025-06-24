#[cfg(feature = "ssr")]
#[tokio::main]
async fn main() {
    use axum::Router;
    use leptos::*;
    use leptos_axum::{generate_route_list, render_app_to_stream_with_context, LeptosRoutes};
    use tower_http::services::ServeDir;
    use youtube_together::server::state::AppState;
    use youtube_together::*;

    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenv::dotenv().ok();

    // Initialize application state
    let app_state = AppState::new()
        .await
        .expect("Failed to initialize app state");

    // Generate routes list
    let conf = get_configuration(None).await.unwrap();
    let leptos_options = conf.leptos_options;
    let addr = leptos_options.site_addr;
    let routes = generate_route_list(App);

    let mut state_routes = app_state.clone();
    let mut state_fallback = app_state.clone();

    // Build the Axum router
    let app = Router::new()
        .leptos_routes_with_context(
            &leptos_options,
            routes,
            move || provide_context(state_routes.clone()),
            App,
        )
        .fallback(render_app_to_stream_with_context(
            leptos_options.clone(),
            move || provide_context(state_fallback.clone()),
            App,
        ))
        .nest_service("/events", app_state.event_handler())
        .nest_service("/longpoll", app_state.long_poll_handler())
        .nest_service("/pkg", ServeDir::new("target/site/pkg"))
        .nest_service("/public", ServeDir::new("public"))
        .with_state(leptos_options.clone());

    // Start the server
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    tracing::info!("listening on http://{}", &addr);
    axum::serve(listener, app.into_make_service())
        .await
        .unwrap();
}

#[cfg(not(feature = "ssr"))]
pub fn main() {
    // This is required when building for WASM
}

#[cfg(feature = "ssr")]
async fn handler_404() -> axum::response::Response<axum::body::Body> {
    use axum::http::StatusCode;
    use axum::response::{Html, IntoResponse};

    (StatusCode::NOT_FOUND, Html("<h1>404 - Page Not Found</h1>")).into_response()
}
