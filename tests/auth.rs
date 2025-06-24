use axum::{Router, routing::get, http::{Request, StatusCode}, body::Body};
use tower::ServiceExt;
use youtube_together::server::auth::auth;

async fn ok_handler() -> &'static str { "ok" }

#[tokio::test]
async fn allow_join_room_without_token() {
    let app = Router::new()
        .route("/api/join_room", get(ok_handler))
        .layer(axum::middleware::from_fn(auth));

    let res = app
        .oneshot(Request::builder().uri("/api/join_room").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(res.status(), StatusCode::OK);
}

#[tokio::test]
async fn reject_other_paths_without_token() {
    let app = Router::new()
        .route("/api/other", get(ok_handler))
        .layer(axum::middleware::from_fn(auth));

    let res = app
        .oneshot(Request::builder().uri("/api/other").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}
