import type { Context as OakContext } from 'oak';
import type { AnyRouter } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

export function createOakTRPCHandler<TRouter extends AnyRouter>(
  router: TRouter,
  endpoint: string,
  createContext: (ctx: OakContext) => any,
) {
  return async (ctx: OakContext) => {
    const request = new Request(ctx.request.url, {
      method: ctx.request.method,
      headers: ctx.request.headers,
      body: ctx.request.hasBody
        ? ctx.request.body({ type: 'stream' }).value
        : undefined,
    });

    const response = await fetchRequestHandler({
      endpoint,
      req: request,
      router,
      createContext: () => createContext(ctx),
    });

    ctx.response.status = response.status;
    for (const [key, value] of response.headers.entries()) {
      ctx.response.headers.set(key, value);
    }
    ctx.response.body = await response.text();
  };
}
