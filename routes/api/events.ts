import { HandlerContext } from "$fresh/server.ts";
import { eventTarget } from "../../state.ts";

export const handler = {
  GET(_req: Request, _ctx: HandlerContext) {
    const stream = new ReadableStream({
      start(controller) {
        const send = () => controller.enqueue(`data: update\n\n`);
        eventTarget.addEventListener("user", send);
        const interval = setInterval(() => controller.enqueue(":\n\n"), 15000);
        controller.enqueue(`retry: 1000\n\n`);
        _req.signal.addEventListener("abort", () => {
          eventTarget.removeEventListener("user", send);
          clearInterval(interval);
          controller.close();
        });
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  },
};
