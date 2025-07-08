import { Handlers } from "$fresh/server.ts";
import { getKv } from "../lib/kv.ts";
import { notifyUpdate } from "../lib/updateNotifier.ts";

async function extractVideoInfo(videoId: string) {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) return null;
  const url =
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    const item = data.items?.[0];
    if (!item) return null;
    const duration = item.contentDetails?.duration as string | undefined;
    const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(duration ?? "");
    const seconds = m
      ? ((Number(m[1]) || 0) * 3600) + ((Number(m[2]) || 0) * 60) +
        (Number(m[3]) || 0)
      : 0;
    return {
      title: item.snippet?.title as string | undefined,
      thumbnail: item.snippet?.thumbnails?.default?.url as string | undefined,
      duration: seconds,
    };
  } catch (_e) {
    return null;
  }
}

function extractVideoId(text: string): string | null {
  try {
    const url = new URL(text);
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1);
    }
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v");
    }
  } catch (_e) {
    // not a URL, maybe plain ID
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
  return null;
}

export const handler: Handlers = {
  async POST(req) {
    const { text, userId } = await req.json();
    if (!text || typeof text !== "string" || !userId) {
      return new Response(JSON.stringify({ error: "invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const kv = await getKv();
    const { value: user } = await kv.get(["users", userId]);
    const userName = user?.name ?? "Unknown";
    const ts = Date.now();
    await kv.set(["chat", ts], { userId, userName, text, ts });
    if (text.startsWith("/add ")) {
      const arg = text.slice(5).trim();
      const videoId = extractVideoId(arg);
      if (videoId) {
        const info = await extractVideoInfo(videoId);
        await kv.set(["queue", Date.now(), videoId], {
          videoId,
          title: info?.title,
          requestedBy: userId,
          duration: info?.duration,
          thumbnail: info?.thumbnail,
        });
      }
    }
    notifyUpdate();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
