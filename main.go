package main

import (
	"log"
	"net/http"
	"os"
	"path"
	"watch2/internal/watch2"
)

func main() {
	go watch2.HandleMessages()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fs := http.Dir("./static")
		fsh := http.FileServer(fs)
		_, err := fs.Open(path.Clean(r.URL.Path))
		if os.IsNotExist(err) {
			r.URL.Path = "/"
		}

		fsh.ServeHTTP(w, r)
	})

	http.HandleFunc("/ws", wsHandler)

	log.Println("Server running on http://localhost:8080")
	log.Fatalln(http.ListenAndServe(":8080", nil))
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	watch2.HandleWS(w, r)
}
