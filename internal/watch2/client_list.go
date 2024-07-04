package watch2

import "log"

var clients = make(map[string]*Client)

func resetLastStatuses() {
	for _, client := range clients {
		client.lastStatus = Status{}
	}
}

func setClientList() {
	var clientListSlice []ClientInfo // Initialize an empty slice of *Client
	for _, client := range clients { // Iterate over the clients map
		// Create a ClientInfo object for each client
		clientInfo := ClientInfo{
			ID:     client.clientID,
			Name:   client.name,
			Status: client.lastStatus.PlaybackState, // Assuming you want to use PlaybackState as the status
		}
		clientListSlice = append(clientListSlice, clientInfo) // Append each ClientInfo to the slice
	}

	msg := Message{
		Type:       "clientList",
		ClientList: clientListSlice, // Assign the slice to ClientList
	}

	sendMessageToAllClients(msg)
}

func sendMessageToAllClients(msg Message) {
	for _, client := range clients {
		sendMessageToClient(msg, client)
	}
}

func sendMessageToClient(msg Message, client *Client) {
	msg.ClientID = client.clientID

	err := client.ws.WriteJSON(msg)
	if err != nil {
		log.Println(err)
		client.ws.Close()
		delete(clients, client.clientID)
	}
}

func sendMessageToAllClientsExcept(msg Message, exceptClient *Client) {
	for _, client := range clients {
		if client.clientID == exceptClient.clientID {
			continue
		}

		sendMessageToClient(msg, client)
	}
}
