import { Handlers } from "$fresh/server.ts";
import { getKv } from "../lib/kv.ts";
import { getCounter, waitForUpdate } from "../lib/updateNotifier.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const since = Number(url.searchParams.get("since") ?? 0);
    if (since < getCounter()) {
      // respond immediately
    } else {
      await waitForUpdate(since);
    }

    const kv = await getKv();
    const { value: state } = await kv.get(["room:state"]);
    const queue: unknown[] = [];
    for await (const entry of kv.list({ prefix: ["queue"] })) {
      queue.push(entry.value);
    }
    const messages: unknown[] = [];
    for await (const entry of kv.list({ prefix: ["chat"] })) {
      messages.push(entry.value);
    }
    return new Response(
      JSON.stringify({ state, queue, messages, counter: getCounter() }),
      { headers: { "Content-Type": "application/json" } },
    );
  },
};
