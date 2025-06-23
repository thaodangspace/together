import { Application, Router, send } from 'oak';
import { oakCors } from 'oak/cors';
import { load } from 'std/dotenv';
import { longPollRouter } from './routes/longpoll.ts';
import { DatabaseManager } from './database/connection.ts';
import { logger } from './utils/logger.ts';
import { YouTubeService } from './services/YouTubeService.ts';
import { longPollManager } from './longpoll/manager.ts';
import { trpcRouter } from './trpc/router.ts';
import { createContext } from './trpc/context.ts';
import { createOakTRPCHandler } from './trpc/oak-adapter.ts';

// Load environment variables
const env = await load();
const PORT = parseInt(env.PORT || '8061');
const CORS_ORIGIN = env.CORS_ORIGIN || 'http://localhost:8061';
const DEFAULT_ROOM_ID = env.DEFAULT_ROOM_ID || 'main-room';
const DEFAULT_ROOM_NAME = env.DEFAULT_ROOM_NAME || 'Main Room';

// Initialize database
await DatabaseManager.initialize();

// Ensure the default room exists
const existingDefault = await DatabaseManager.query(
  'SELECT * FROM rooms WHERE id = ?',
  [DEFAULT_ROOM_ID],
);
if (existingDefault.length === 0) {
  await DatabaseManager.execute(
    `INSERT INTO rooms (id, name, owner_id, created_at) VALUES (?, ?, ?, datetime('now'))`,
    [DEFAULT_ROOM_ID, DEFAULT_ROOM_NAME, 'system'],
  );
  logger.info('Default room created', {
    id: DEFAULT_ROOM_ID,
    name: DEFAULT_ROOM_NAME,
  });
}

// Initialize Oak application
const app = new Application();
const router = new Router();

// tRPC middleware
const trpcMiddleware = createOakTRPCHandler(trpcRouter, '/trpc', createContext);
router.all('/trpc/:path+', trpcMiddleware);

// CORS middleware
app.use(
    oakCors({
        origin: CORS_ORIGIN,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Request logging middleware
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.info(
        `${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status} - ${ms}ms`
    );
});

// Error handling middleware
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        logger.error('Server error:', error as Error);
        ctx.response.status = 500;
        ctx.response.body = {
            error: 'Internal server error',
            message:
                env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong',
        };
    }
});

// Health check endpoint
router.get('/health', (ctx) => {
    ctx.response.body = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: performance.now() / 1000, // uptime in seconds since server start
        version: '1.0.0',
    };
});


// Video control endpoints
router.post('/api/rooms/:roomId/video/state', async (ctx) => {
    const { roomId } = ctx.params;
    const body = await ctx.request.body().value;
    const { userId, isPlaying, position } = body;

    try {
        // Update room state
        await DatabaseManager.execute(
            `UPDATE rooms SET 
       current_position = ?, 
       is_playing = ?, 
       last_updated = datetime('now') 
       WHERE id = ?`,
            [position, isPlaying, roomId]
        );

        // Notify other users
        longPollManager.notifyRoom(roomId, {
            type: 'video_state_changed',
            data: {
                isPlaying,
                position,
                updatedBy: userId,
                timestamp: Date.now(),
            },
            timestamp: Date.now(),
        });

        ctx.response.body = { success: true };
    } catch (error) {
        logger.error('Error updating video state', error as Error);
        ctx.response.status = 500;
        ctx.response.body = { error: 'Failed to update video state' };
    }
});

// Queue management endpoints
router.post('/api/rooms/:roomId/queue', async (ctx) => {
    const { roomId } = ctx.params;
    const body = await ctx.request.body().value;
    const { userId, videoUrl } = body;

    if (!YouTubeService.validateYouTubeUrl(videoUrl)) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'Invalid YouTube URL' };
        return;
    }

    try {
        // Get video info from YouTube
        const videoInfo = await YouTubeService.getVideoInfoFromUrl(videoUrl);

        // Get user info
        const userResult = await DatabaseManager.query('SELECT username FROM users WHERE id = ?', [
            userId,
        ]);
        const user = userResult[0];

        // Get next position in queue
        const queue = await DatabaseManager.getQueue(roomId);
        const nextPosition = queue.length + 1;

        // Add to queue
        await DatabaseManager.execute(
            `INSERT INTO queue (room_id, video_id, video_url, video_title, video_duration, video_thumbnail, added_by, position, added_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
                roomId,
                videoInfo.id,
                videoUrl,
                videoInfo.title,
                videoInfo.duration,
                videoInfo.thumbnail,
                userId,
                nextPosition,
            ]
        );

        // If no current video, start playing this one
        const roomResult = await DatabaseManager.query(
            'SELECT current_video_id FROM rooms WHERE id = ?',
            [roomId]
        );
        const room = roomResult[0];
        if (!room?.current_video_id) {
            await DatabaseManager.execute(
                `UPDATE rooms SET 
         current_video_id = ?, 
         current_video_url = ?, 
         current_video_title = ?, 
         current_video_duration = ?, 
         current_position = 0, 
         is_playing = true, 
         last_updated = datetime('now') 
         WHERE id = ?`,
                [videoInfo.id, videoUrl, videoInfo.title, videoInfo.duration, roomId]
            );

            // Remove from queue since it's now playing
            await DatabaseManager.execute('DELETE FROM queue WHERE room_id = ? AND video_id = ?', [
                roomId,
                videoInfo.id,
            ]);

            longPollManager.notifyRoom(roomId, {
                type: 'current_video_changed',
                data: { video: videoInfo, updatedBy: userId },
                timestamp: Date.now(),
            });
        } else {
            // Notify queue update
            longPollManager.notifyRoom(roomId, {
                type: 'queue_updated',
                data: {
                    action: 'added',
                    video: {
                        ...videoInfo,
                        addedBy: user?.username || 'Unknown',
                        position: nextPosition,
                    },
                },
                timestamp: Date.now(),
            });
        }

        ctx.response.body = { success: true, data: { video: videoInfo } };
        logger.info('Video added to queue', { roomId, userId, videoId: videoInfo.id });
    } catch (error) {
        logger.error('Error adding video to queue', error as Error);
        ctx.response.status = 500;
        ctx.response.body = { error: 'Failed to add video to queue' };
    }
});

// Chat endpoints
router.post('/api/rooms/:roomId/messages', async (ctx) => {
    const { roomId } = ctx.params;
    const body = await ctx.request.body().value;
    const { userId, content, messageType = 'text' } = body;

    try {
        // Get user info
        const userResult = await DatabaseManager.query('SELECT username FROM users WHERE id = ?', [
            userId,
        ]);
        const user = userResult[0];
        if (!user) {
            ctx.response.status = 404;
            ctx.response.body = { error: 'User not found' };
            return;
        }

        // Save message
        const result = await DatabaseManager.execute(
            `INSERT INTO messages (room_id, user_id, username, content, message_type, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       RETURNING id, created_at`,
            [roomId, userId, user.username, content, messageType]
        );

        const message = {
            id: result.id,
            userId,
            username: user.username,
            content,
            messageType,
            createdAt: result.created_at,
        };

        // Notify users
        longPollManager.notifyRoom(roomId, {
            type: 'new_message',
            data: message,
            timestamp: Date.now(),
        });

        ctx.response.body = { success: true, data: message };
    } catch (error) {
        logger.error('Error sending message', error as Error);
        ctx.response.status = 500;
        ctx.response.body = { error: 'Failed to send message' };
    }
});

router.get('/api/rooms/:roomId/messages', async (ctx) => {
    const { roomId } = ctx.params;
    const url = new URL(ctx.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    try {
        const messages = await DatabaseManager.query(
            `SELECT id, user_id, username, content, message_type, created_at
       FROM messages 
       WHERE room_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
            [roomId, limit, offset]
        );

        ctx.response.body = { success: true, data: messages.reverse() };
    } catch (error) {
        logger.error('Error getting messages', error as Error);
        ctx.response.status = 500;
        ctx.response.body = { error: 'Failed to get messages' };
    }
});

// Long-polling routes
app.use(longPollRouter.routes());
app.use(longPollRouter.allowedMethods());

// Main router
app.use(router.routes());
app.use(router.allowedMethods());

// Add static file serving middleware (this should be last)
app.use(async (ctx, next) => {
    try {
        // Try to serve static files from the dist directory
        await send(ctx, ctx.request.url.pathname, {
            root: `${Deno.cwd()}/dist`,
            index: 'index.html',
        });
    } catch {
        // If file not found, serve index.html for SPA routing
        try {
            await send(ctx, '/index.html', {
                root: `${Deno.cwd()}/dist`,
            });
        } catch {
            // If no dist directory exists, return 404
            ctx.response.status = 404;
            ctx.response.body = 'Not Found';
        }
    }
});

// Start server
logger.info(`🚀 SyncWatch server starting on port ${PORT}`);
logger.info(`📡 CORS enabled for origin: ${CORS_ORIGIN}`);
logger.info(`🔗 Health check available at: http://localhost:${PORT}/health`);
logger.info(`🎬 SyncWatch API ready at: http://localhost:${PORT}/api`);

await app.listen({ port: PORT });
