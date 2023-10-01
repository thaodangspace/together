package utube

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
)

var re1 = regexp.MustCompile(`youtube\.com\/watch\?v=(.{11})`)
var re2 = regexp.MustCompile(`youtu\.be\/(.{11})`)
var language = "undefined"

func youtubeCanHandle(url string) bool {
	return re1.MatchString(url) || re2.MatchString(url)
}

func youtubeGet(url string) (details VideoDetails, err error) {
	var videoID string
	if re1.MatchString(url) {
		videoID = re1.FindStringSubmatch(url)[1]
	} else {
		videoID = re2.FindStringSubmatch(url)[1]
	}

	details.Title = make(map[string]string)
	details.Description = make(map[string]string)
	details.URL = make(map[string]string)
	details.URL[language] = videoID
	details.Languages = append(details.Languages, language)
	details.Source = "youtube"

	err = youtubeFetchDetails(videoID, &details)
	if err != nil {
		return details, err
	}

	return details, nil
}

func youtubeFetchDetails(videoID string, details *VideoDetails) error {
	apiURL := fmt.Sprintf("https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=%v&format=json", videoID)
	resp, err := Client.Get(apiURL)
	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return errors.New("Video not found")
	}

	type responseStruct struct {
		Title      string `json:"title"`
		AuthorName string `json:"author_name"`
		Width      int    `json:"width"`
		Height     int    `json:"height"`
	}
	var response responseStruct
	err = json.NewDecoder(resp.Body).Decode(&response)
	if err != nil {
		return errors.New("An error occurred")
	}

	details.AspectRatioWidth = response.Width
	details.AspectRatioHeight = response.Height
	details.Title[language] = response.Title
	details.Description[language] = fmt.Sprintf("Video by %v", response.AuthorName)

	return nil
}
