// Server-Sent Events handling will be implemented here
// This file will contain functions for:
// - Event broadcasting
// - Client connection management
// - Real-time synchronization

use crate::types::Event;
use tokio::sync::broadcast;

/// Simple manager around a broadcast channel for SSE events.
pub struct EventManager {
    sender: broadcast::Sender<Event>,
}

impl EventManager {
    /// Create a new [`EventManager`] with a reasonable buffer size.
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(1000);
        Self { sender }
    }

    /// Subscribe to the event stream.
    pub fn subscribe(&self) -> broadcast::Receiver<Event> {
        self.sender.subscribe()
    }

    /// Broadcast an event to all subscribers.
    pub fn broadcast_event(&self, event: Event) {
        let _ = self.sender.send(event);
    }
}
