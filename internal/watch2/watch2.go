package watch2

import (
	"fmt"
	"log"
	"net/http"
	"watch2/internal/utils"
	"watch2/utube"

	"github.com/gorilla/websocket"
)

var lastVideoDetails utube.VideoDetails
var upgrader = websocket.Upgrader{}
var broadcast = make(chan Message)

func HandleMessages() {

	for {
		msg := <-broadcast

		func() {
			switch msg.Type {
			//case "join":
			//	join(msg)
			//
			//case "setPlaybackState":
			//	setPlaybackState(msg)
			//
			//case "requestVideo":
			//	requestVideo(msg)
			//
			//case "jumpToTime":
			//	jumpToTime(msg)
			//
			//case "reportStatus":
			//	handleReportStatus(msg)
			//
			//case "chatMessage":
			//	chatMessage(msg)

			default:
				fmt.Printf("Error: Unknown message type '%v'\n", msg.Type)
			}
		}()
	}
}

func HandleWS(w http.ResponseWriter, r *http.Request) {
	clientIDs, ok := r.URL.Query()["clientId"]
	if !ok || len(clientIDs) == 0 {
		log.Printf("Parameter 'clientId' not present in websocket url")
		w.WriteHeader(400)
		return
	}
	clientID := clientIDs[0]

	upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer ws.Close()

	log.Printf("ClienClientt %v successfully connected", clientID)
	client := NewClient(clientID, ws)
	clients[clientID] = client

	client.welcomeClient()

	for {
		var msg Message
		msgString, err := utils.ParseWebsocketJSON(ws, &msg)
		if err != nil {
			client.leftRoom()
			log.Println(err)
			delete(clients, clientID)
			setClientList()
			break
		}

		fmt.Printf("New message: %+v\n", msgString)
		broadcast <- msg
	}
}
