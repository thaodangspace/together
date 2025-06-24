#[cfg(feature = "ssr")]
#[tokio::main]
async fn main() {
    use axum::Router;
    use leptos::*;
    use tower_http::services::ServeDir;

    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenv::dotenv().ok();

    // Generate routes list  
    let conf = get_configuration(None).await.unwrap();
    let leptos_options = conf.leptos_options;
    let addr = leptos_options.site_addr;

    // Build the Axum router (simplified for now)
    let app = Router::new()
        .fallback(|| async { "YouTube Together - Server is running! Frontend coming soon..." })
        .nest_service("/pkg", ServeDir::new("target/site/pkg"))
        .nest_service("/public", ServeDir::new("public"));

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