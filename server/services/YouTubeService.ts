import { logger } from '../utils/logger.ts';

export interface VideoInfo {
    id: string;
    title: string;
    duration: number;
    thumbnail: string;
    channelTitle?: string;
}

export class YouTubeService {
    private static apiKey = Deno.env.get('YOUTUBE_API_KEY');
    private static cache = new Map<string, VideoInfo>();

    static extractVideoId(url: string): string | null {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    static async getVideoInfo(videoId: string): Promise<VideoInfo> {
        // Check cache first
        if (this.cache.has(videoId)) {
            logger.debug('Video info retrieved from cache', { videoId });
            return this.cache.get(videoId)!;
        }

        if (!this.apiKey) {
            logger.warn('YouTube API key not configured, using fallback data');
            return this.getFallbackVideoInfo(videoId);
        }

        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${this.apiKey}&part=snippet,contentDetails`
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                throw new Error('Video not found');
            }

            const video = data.items[0];
            const videoInfo: VideoInfo = {
                id: videoId,
                title: video.snippet.title,
                duration: this.parseDuration(video.contentDetails.duration),
                thumbnail:
                    video.snippet.thumbnails.maxres?.url ||
                    video.snippet.thumbnails.high?.url ||
                    video.snippet.thumbnails.medium?.url ||
                    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                channelTitle: video.snippet.channelTitle,
            };

            // Cache for 1 hour
            this.cache.set(videoId, videoInfo);
            setTimeout(() => this.cache.delete(videoId), 3600000);

            logger.debug('Video info retrieved from YouTube API', {
                videoId,
                title: videoInfo.title,
            });
            return videoInfo;
        } catch (error) {
            logger.error('Error fetching video info from YouTube API', error as Error, { videoId });
            return this.getFallbackVideoInfo(videoId);
        }
    }

    private static getFallbackVideoInfo(videoId: string): VideoInfo {
        return {
            id: videoId,
            title: 'Unknown Video',
            duration: 0,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            channelTitle: 'Unknown Channel',
        };
    }

    private static parseDuration(duration: string): number {
        // Parse ISO 8601 duration format (PT4M13S = 4 minutes 13 seconds)
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;

        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        const seconds = parseInt(match[3] || '0');

        return hours * 3600 + minutes * 60 + seconds;
    }

    static validateYouTubeUrl(url: string): boolean {
        const videoId = this.extractVideoId(url);
        return videoId !== null && videoId.length === 11;
    }

    static async getVideoInfoFromUrl(url: string): Promise<VideoInfo> {
        const videoId = this.extractVideoId(url);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        return await this.getVideoInfo(videoId);
    }
}
