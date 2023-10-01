package utube

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
)

func arteCanHandle(url string) bool {
	re := regexp.MustCompile(`arte\.tv\/\w\w\/videos\/\d+-\d+-A`)
	return re.MatchString(url)
}

func arteGet(url string) (details VideoDetails, err error) {
	details.Title = make(map[string]string)
	details.Description = make(map[string]string)
	details.URL = make(map[string]string)

	re := regexp.MustCompile(`\d+-\d+-A`)
	videoID := re.FindString(url)

	if videoID == "" {
		return details, errors.New("Can't find video")
	}

	for _, language := range []string{"fr", "de"} {
		apiURL := fmt.Sprintf("https://api.arte.tv/api/player/v1/config/%s/%s?platform=ARTE_NEXT", language, videoID)
		resp, err := Client.Get(apiURL)
		if err != nil {
			return details, err
		}

		defer resp.Body.Close()

		type responseMediaVersion struct {
			URL string `json:"url"`
		}
		type responseCustomMessage struct {
			Message string `json:"msg"`
			Type    string `json:"type"`
		}
		type responseVideoJSONPlayer struct {
			Title         string                          `json:"VTI"`
			Description   string                          `json:"VDE"`
			VSR           map[string]responseMediaVersion `json:"VSR"`
			CustomMessage responseCustomMessage           `json:"customMsg"`
		}
		type responseStruct struct {
			Details responseVideoJSONPlayer `json:"videoJsonPlayer"`
		}
		var response responseStruct
		err = json.NewDecoder(resp.Body).Decode(&response)
		if err != nil {
			return details, errors.New("Error")
		}

		if response.Details.CustomMessage.Type == "error" {
			return details, errors.New("Video doesn't exist")
		}

		details.Title[language] = response.Details.Title
		details.Description[language] = response.Details.Description
		details.URL[language] = response.Details.VSR["HTTPS_SQ_1"].URL
		details.Languages = append(details.Languages, language)
	}
	details.Source = "arte"

	return details, nil
}
