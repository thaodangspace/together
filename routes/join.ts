import { Handlers } from "$fresh/server.ts";
import { getKv } from "../lib/kv.ts";

export const handler: Handlers = {
  async POST(req) {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "name required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const id = crypto.randomUUID();
    const kv = await getKv();
    await kv.set(["users", id], {
      id,
      name,
      joinedAt: new Date().toISOString(),
      ip,
    });
    return new Response(JSON.stringify({ id }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
