const express = require('express');
const { initTRPC } = require('@trpc/server');
const { createExpressMiddleware } = require('@trpc/server/adapters/express');
const { z } = require('zod');

const t = initTRPC.create();
const rooms = new Map();
const usersByRoom = new Map();

const appRouter = t.router({
  createRoom: t.procedure
    .input(z.object({ name: z.string(), username: z.string() }))
    .mutation(({ input }) => {
      const roomId = Math.random().toString(36).slice(2);
      const userId = Math.random().toString(36).slice(2);
      const room = {
        id: roomId,
        name: input.name,
        ownerId: userId,
        videoState: { isPlaying: false, position: 0 }
      };
      rooms.set(roomId, room);
      usersByRoom.set(roomId, new Map([[userId, { username: input.username }]]));
      return { roomId, userId };
    }),

  joinRoom: t.procedure
    .input(z.object({ roomId: z.string(), username: z.string() }))
    .mutation(({ input }) => {
      const room = rooms.get(input.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      const userId = Math.random().toString(36).slice(2);
      if (!usersByRoom.has(input.roomId)) {
        usersByRoom.set(input.roomId, new Map());
      }
      usersByRoom.get(input.roomId).set(userId, { username: input.username });
      return { userId };
    }),

  getVideoState: t.procedure
    .input(z.object({ roomId: z.string() }))
    .query(({ input }) => {
      const room = rooms.get(input.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      return room.videoState;
    }),

  updateVideoState: t.procedure
    .input(z.object({ roomId: z.string(), isPlaying: z.boolean(), position: z.number() }))
    .mutation(({ input }) => {
      const room = rooms.get(input.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      room.videoState = { isPlaying: input.isPlaying, position: input.position };
      return room.videoState;
    }),

  ping: t.procedure.query(() => ({ message: 'pong' }))
});

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/trpc', createExpressMiddleware({ router: appRouter }));
  app.get('/', (_, res) => res.send('SyncWatch backend'));
  return app;
}

if (require.main === module) {
  const PORT = process.env.PORT || 8000;
  createApp().listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = { createApp, appRouter, rooms, usersByRoom };
