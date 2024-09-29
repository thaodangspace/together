package watch2

import (
	"sync"
)

type Room struct {
	mu      sync.Mutex
	clients map[*Client]bool
}

func NewRoom() *Room {
	return &Room{
		clients: make(map[*Client]bool),
	}
}

func (r *Room) AddClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.clients[client] = true
}

func (r *Room) RemoveClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.clients, client)
}

func (r *Room) GetClientList() []*Client {
	r.mu.Lock()
	defer r.mu.Unlock()
	clientList := make([]*Client, 0, len(r.clients))
	for client := range r.clients {
		clientList = append(clientList, client)
	}
	return clientList
}
