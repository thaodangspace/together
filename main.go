package main

import (
	"net/http"
	"os"
	"watch2/internal/watch2"

	"github.com/go-kit/log"
)

func main() {
	var logger log.Logger
	{
		logger = log.NewLogfmtLogger(log.NewSyncWriter(os.Stderr))
		logger = log.With(logger, "ts", log.DefaultTimestampUTC, "caller", log.DefaultCaller)
	}
	// Initialize the composite structure
	messageHandler := watch2.NewMessageHandler(logger)

	// Start handling messages
	// go messageHandler.HandleMessages()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Handle root requests
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// Handle WebSocket requests
		messageHandler.HandleWebSocket(w, r)
	})

	http.ListenAndServe(":8080", nil)
}
