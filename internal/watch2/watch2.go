package watch2

import (
	"net/http"
	"sync"

	"github.com/go-kit/log"
)

type MessageHandler struct {
	mu      sync.Mutex
	clients map[*Client]bool
	room    *Room
	logger  log.Logger
}

func NewMessageHandler(logger log.Logger) *MessageHandler {
	return &MessageHandler{
		clients: make(map[*Client]bool),
		room:    NewRoom(),
		logger:  logger,
	}
}

func (mh *MessageHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	mh.mu.Lock()
	defer mh.mu.Unlock()
	mh.logger.Log("msg", "Handling websocket request")

	client := NewClient(mh.room)
	mh.clients[client] = true
	mh.room.AddClient(client)

	client.HandleWebSocket(w, r)
}
