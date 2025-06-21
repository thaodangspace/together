const express = require('express');
const { initTRPC } = require('@trpc/server');
const { createExpressMiddleware } = require('@trpc/server/adapters/express');
const { z } = require('zod');

const t = initTRPC.create();
const rooms = new Map();

const appRouter = t.router({
  createRoom: t.procedure
    .input(z.object({ name: z.string(), username: z.string() }))
    .mutation(({ input }) => {
      const roomId = Math.random().toString(36).slice(2);
      const userId = Math.random().toString(36).slice(2);
      const room = { id: roomId, name: input.name, ownerId: userId };
      rooms.set(roomId, room);
      return { roomId, userId };
    }),
  ping: t.procedure.query(() => ({ message: 'pong' })),
});

const app = express();
app.use(express.json());
app.use('/trpc', createExpressMiddleware({ router: appRouter }));
app.get('/', (_, res) => res.send('SyncWatch backend'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

module.exports = { appRouter };
