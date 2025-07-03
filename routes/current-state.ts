import { Handlers } from "$fresh/server.ts";
import { getKv } from "../lib/kv.ts";

export const handler: Handlers = {
  async GET() {
    const kv = await getKv();
    const { value: state } = await kv.get(["room:state"]);
    const queue: unknown[] = [];
    for await (const entry of kv.list({ prefix: ["queue"] })) {
      queue.push(entry.value);
    }
    return new Response(JSON.stringify({ state, queue }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
