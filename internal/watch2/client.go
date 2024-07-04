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

type ClientInfo struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

type Message struct {
	Type          string              `json:"type"`
	Text          string              `json:"text,omitempty"`
	PlaybackState string              `json:"playbackState,omitempty"`
	VideoDetails  *utube.VideoDetails `json:"videoDetails,omitempty"`
	Seconds       int                 `json:"seconds,omitempty"`
	Status        *Status             `json:"status,omitempty"`
	ClientList    []ClientInfo        `json:"clientList,omitempty"`
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

func (c *Client) welcomeClient() {
	//if len(lastVideoDetails.URL) == 0 {
	//	return
	//}

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

	c.join(Message{
		Type:          "setVideoDetails",
		VideoDetails:  &lastVideoDetails,
		Seconds:       maxCurrentTime,
		PlaybackState: playbackState,
		ClientID:      "server",
	})
}

func (c *Client) join(msg Message) {
	log.Printf("Client %v joined as '%v'\n", msg.ClientID, msg.Text)
	for _, client := range clients {
		if client.clientID == msg.ClientID {
			client.name = msg.Text
		}
	}

	notificationMsg := Message{
		Type: "clientJoined",
		Text: msg.Text,
	}

	sendMessageToAllClientsExcept(notificationMsg, c)
	setClientList()
}

func (c *Client) leftRoom() {
	fmt.Printf("Client %v left\n", c.clientID)
	var clientName string

	for _, client := range clients {
		if client.clientID == c.clientID {
			clientName = client.name
			break
		}
	}

	notificationMsg := Message{
		Type: "clientLeft",
		Text: clientName,
	}

	sendMessageToAllClientsExcept(notificationMsg, c)
}

func (c *Client) setPlaybackState(msg Message) {
	sendMessageToAllClientsExcept(msg, c)
}

func (c *Client) requestVideo(msg Message) {
	details, err := utube.GetVideoDetails(msg.Text)
	if err != nil {
		fmt.Println("Error:", err)
		sendMessageToClient(Message{
			Type: "error",
			Text: err.Error(),
		}, c)
		return
	}
	lastVideoDetails = details

	resetLastStatuses()

	sendMessageToAllClients(Message{
		Type:         "setVideoDetails",
		VideoDetails: &details,
	})
}
