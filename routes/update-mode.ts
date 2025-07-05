import { Handlers } from "$fresh/server.ts";
import { getKv } from "../lib/kv.ts";
import { notifyUpdate } from "../lib/updateNotifier.ts";

export const handler: Handlers = {
  async POST(req) {
    const { mode } = await req.json();
    if (mode !== "video" && mode !== "radio") {
      return new Response(JSON.stringify({ error: "invalid mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const kv = await getKv();
    const { value: state } = await kv.get(["room:state"]);
    const newState = {
      currentVideoId: state?.currentVideoId ?? null,
      playbackTime: state?.playbackTime ?? 0,
      mode,
      lastUpdated: new Date().toISOString(),
    };
    await kv.set(["room:state"], newState);
    notifyUpdate();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
