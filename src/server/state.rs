use crate::types::Event;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite, SqlitePool};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::broadcast;

#[derive(Clone)]
pub struct AppState {
    pub db: Pool<Sqlite>,
    pub event_sender: broadcast::Sender<Event>,
}

impl AppState {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let database_url =
            std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:./database.db".to_string());

        let db = SqlitePool::connect(&database_url).await?;

        // Run migrations
        sqlx::migrate!("./migrations").run(&db).await?;

        let (event_sender, _) = broadcast::channel(1000);

        Ok(Self { db, event_sender })
    }

    pub async fn broadcast_event(&self, event: Event) {
        let _ = self.event_sender.send(event);
    }

    pub fn event_handler(&self) -> axum::Router {
        use axum::{
            response::sse::{Event as SseEvent, KeepAlive, Sse},
            response::Response,
            routing::get,
        };
        use futures::stream::{self, Stream};
        use std::convert::Infallible;

        let sender = self.event_sender.clone();

        axum::Router::new().route(
            "/",
            get(|| async move {
                let rx = sender.subscribe();
                let stream = stream::unfold(rx, |mut rx| async move {
                    match rx.recv().await {
                        Ok(event) => {
                            let json = serde_json::to_string(&event).unwrap_or_default();
                            Some((
                                Ok::<_, Infallible>(
                                    SseEvent::default().event(&event.event_type).data(json),
                                ),
                                rx,
                            ))
                        }
                        Err(_) => None,
                    }
                });

                Sse::new(stream).keep_alive(KeepAlive::default())
            }),
        )
    }

    pub fn long_poll_handler(&self) -> axum::Router {
        use axum::{http::StatusCode, response::IntoResponse, routing::get};

        let sender = self.event_sender.clone();

        axum::Router::new().route(
            "/",
            get(|| async move {
                let mut rx = sender.subscribe();
                match tokio::time::timeout(Duration::from_secs(25), rx.recv()).await {
                    Ok(Ok(event)) => {
                        let body = serde_json::to_string(&event).unwrap_or_default();
                        (StatusCode::OK, body).into_response()
                    }
                    _ => StatusCode::NO_CONTENT.into_response(),
                }
            }),
        )
    }
}
