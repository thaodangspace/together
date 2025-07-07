import { Handlers } from "$fresh/server.ts";
import { getKv } from "../../lib/kv.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const kv = await getKv();
    const { value } = await kv.get(["users", id]);
    const valid = Boolean(value);
    return new Response(JSON.stringify({ valid }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
