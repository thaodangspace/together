import { Handlers } from "$fresh/server.ts";
import { getKv } from "../lib/kv.ts";
import { notifyUpdate } from "../lib/updateNotifier.ts";

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
    notifyUpdate();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
