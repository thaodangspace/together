const request = require('supertest');
const { createApp, rooms, usersByRoom } = require('./server');

describe('tRPC backend', () => {
  let app;

  beforeEach(() => {
    rooms.clear();
    usersByRoom.clear();
    app = createApp();
  });

  test('createRoom stores room and user', async () => {
    const res = await request(app)
      .post('/trpc/createRoom')
      .send({ name: 'Test Room', username: 'Alice' });
    expect(res.statusCode).toBe(200);
    const { roomId, userId } = res.body.result.data;
    expect(rooms.has(roomId)).toBe(true);
    expect(usersByRoom.get(roomId).has(userId)).toBe(true);
  });

  test('joinRoom and updateVideoState', async () => {
    const createRes = await request(app)
      .post('/trpc/createRoom')
      .send({ name: 'Test Room', username: 'Owner' });
    const roomId = createRes.body.result.data.roomId;

    const joinRes = await request(app)
      .post('/trpc/joinRoom')
      .send({ roomId, username: 'Bob' });
    expect(joinRes.statusCode).toBe(200);
    const joinUserId = joinRes.body.result.data.userId;
    expect(usersByRoom.get(roomId).has(joinUserId)).toBe(true);

    await request(app)
      .post('/trpc/updateVideoState')
      .send({ roomId, isPlaying: true, position: 42 });

    const stateRes = await request(app)
      .get('/trpc/getVideoState')
      .query({ input: JSON.stringify({ roomId }) });
    expect(stateRes.body.result.data).toEqual({ isPlaying: true, position: 42 });
  });
});
