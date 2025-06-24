use std::sync::Arc;
use sqlx::{SqlitePool, Pool, Sqlite};
use tokio::sync::broadcast;
use serde::{Serialize, Deserialize};
use crate::types::Event;

#[derive(Clone)]
pub struct AppState {
    pub db: Pool<Sqlite>,
    pub event_sender: broadcast::Sender<Event>,
}

impl AppState {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "sqlite:./database.db".to_string());

        let db = SqlitePool::connect(&database_url).await?;

        // Run migrations
        sqlx::migrate!("./migrations").run(&db).await?;

        let (event_sender, _) = broadcast::channel(1000);

        Ok(Self {
            db,
            event_sender,
        })
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
                                    SseEvent::default()
                                        .event(&event.event_type)
                                        .data(json)
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
} 