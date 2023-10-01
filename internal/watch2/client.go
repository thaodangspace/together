package watch2

import (
	"fmt"
	"log"
	"watch2/internal/utils"
	"watch2/utube"

	"github.com/gorilla/websocket"
)

type Client struct {
	clientID   string
	ws         *websocket.Conn
	lastStatus Status
	name       string
}

type Status struct {
	PlaybackState string `json:"playbackState"`
	CurrentTime   int    `json:"currentTime"`
}

type Message struct {
	Type          string              `json:"type"`
	Text          string              `json:"text,omitempty"`
	PlaybackState string              `json:"playbackState,omitempty"`
	VideoDetails  *utube.VideoDetails `json:"videoDetails,omitempty"`
	Seconds       int                 `json:"seconds,omitempty"`
	Status        *Status             `json:"status,omitempty"`
	ClientList    []string            `json:"clientList,omitempty"`
	SourceClient  string              `json:"sourceClient,omitempty"`
	ClientID      string              `json:"clientId,omitempty"`
	Date          int                 `json:"date"`
}

func NewClient(clientID string, ws *websocket.Conn) *Client {
	return &Client{
		clientID: clientID,
		ws:       ws,
	}
}

func (c *Client) join(msg Message) {
	fmt.Printf("Client %v joined as '%v'\n", msg.ClientID, msg.Text)
	for _, client := range clients {
		if client.clientID == msg.ClientID {
			client.name = msg.Text
		}
	}

	notificationMsg := Message{
		Type: "clientJoined",
		Text: msg.Text,
	}

	c.sendMessageToAllClientsExcept(notificationMsg, msg.ClientID)
	c.setClientList()
}

func (c *Client) leftRoom(clientID string) {
	fmt.Printf("Client %v left\n", clientID)
	var clientName string

	for _, client := range clients {
		if client.clientID == clientID {
			clientName = client.name
			break
		}
	}

	notificationMsg := Message{
		Type: "clientLeft",
		Text: clientName,
	}

	c.sendMessageToAllClientsExcept(notificationMsg, clientID)
}

func (c *Client) setClientList() {
	var clientList []string

	for _, client := range clients {
		clientList = append(clientList, client.name)
	}

	msg := Message{
		Type:       "clientList",
		ClientList: clientList,
	}

	c.sendMessageToAllClients(msg)
}

func (c *Client) setPlaybackState(msg Message) {
	c.sendMessageToAllClientsExcept(msg, msg.ClientID)
}

func (c *Client) requestVideo(msg Message) {
	details, err := utube.GetVideoDetails(msg.Text)
	if err != nil {
		fmt.Println("Error:", err)
		c.sendMessageToClient(Message{
			Type: "error",
			Text: err.Error(),
		})
		return
	}
	lastVideoDetails = details

	resetLastStatuses()

	c.sendMessageToAllClients(Message{
		Type:         "setVideoDetails",
		VideoDetails: &details,
	})
}

func (c *Client) sendMessageToAllClients(msg Message) {
	for range clients {
		c.sendMessageToClient(msg)
	}
}

func (c *Client) sendMessageToAllClientsExcept(msg Message, clientID string) {
	for _, client := range clients {
		if client.clientID == clientID {
			continue
		}

		c.sendMessageToClient(msg)
	}
}

func (c *Client) sendMessageToClient(msg Message) {
	msg.ClientID = "server"
	msg.ClientID = "TODO"

	err := c.ws.WriteJSON(msg)
	if err != nil {
		log.Println(err)
		c.ws.Close()
		delete(clients, c.clientID)
	}
}

func (c *Client) welcomeClient() {
	if len(lastVideoDetails.URL) == 0 {
		return
	}

	var currentTimes []int
	otherClientsArePlaying := false
	for _, client := range clients {
		if c.clientID == client.clientID {
			continue
		}

		if c.lastStatus.PlaybackState == "" {
			continue
		}

		if c.lastStatus.PlaybackState != "paused" {
			otherClientsArePlaying = true
		}

		currentTimes = append(currentTimes, c.lastStatus.CurrentTime)
	}

	maxCurrentTime := utils.FindMax(currentTimes)

	playbackState := "paused"
	if otherClientsArePlaying {
		playbackState = "playing"
	}

	c.sendMessageToClient(Message{
		Type:          "setVideoDetails",
		VideoDetails:  &lastVideoDetails,
		Seconds:       maxCurrentTime,
		PlaybackState: playbackState,
		ClientID:      "server",
	})
}
