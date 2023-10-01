package utube

import (
	"fmt"
	"regexp"
	"strings"
)

func mp4CanHandle(url string) bool {
	return strings.HasSuffix(url, ".mp4")
}

func mp4Get(url string) (details VideoDetails, err error) {
	// Get host (https://github.com/Lanseuo -> github.com)
	re := regexp.MustCompile(`\/\/([^\/]*)`)
	host := re.FindStringSubmatch(url)[1]

	language := "undefined"

	details.Title = make(map[string]string)
	details.Title[language] = fmt.Sprintf("Video from %v", host)
	details.Description = make(map[string]string)
	details.URL = make(map[string]string)
	details.URL[language] = url
	details.Languages = append(details.Languages, language)
	details.Source = "mp4"

	return details, nil
}
