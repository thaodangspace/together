package watch2

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	room *Room
	// Add necessary fields for the client
}

func NewClient(room *Room) *Client {
	return &Client{
		room: room,
	}
}

func (c *Client) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	clientList := c.room.GetClientList()

	roomInfo := struct {
		Clients []*Client `json:"clients"`
	}{
		Clients: clientList,
	}

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		log.Printf("Received: %s", message)

		err = conn.WriteJSON(roomInfo)
		if err != nil {
			log.Println("Write error:", err)
			break
		}

		log.Printf("Sent: %v", roomInfo)
	}
}

func (c *Client) SendMessage(message string) {
	// Implement sending a message to the client
}
