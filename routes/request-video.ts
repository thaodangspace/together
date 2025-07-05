import { Handlers } from "$fresh/server.ts";
import { getKv } from "../lib/kv.ts";
import { notifyUpdate } from "../lib/updateNotifier.ts";

export const handler: Handlers = {
  async POST(req) {
    const { videoId, userId, title, duration, thumbnail } = await req.json();
    if (!videoId || typeof videoId !== "string" || !userId) {
      return new Response(JSON.stringify({ error: "invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const ts = Date.now();
    const kv = await getKv();
    await kv.set(["queue", ts, videoId], {
      videoId,
      title,
      requestedBy: userId,
      duration,
      thumbnail,
    });
    notifyUpdate();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
