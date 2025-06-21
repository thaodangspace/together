import { Router } from 'oak';
import { longPollManager } from '../longpoll/manager.ts';
import { logger } from '../utils/logger.ts';

export const longPollRouter = new Router();

// Long-polling endpoint for room events
longPollRouter.get('/api/rooms/:roomId/poll', async (ctx) => {
    const roomId = ctx.params.roomId;
    const userId = ctx.request.url.searchParams.get('userId');

    if (!roomId || !userId) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'Missing roomId or userId' };
        return;
    }

    logger.debug('Long-poll request received', { roomId, userId });

    try {
        // Handle the long-polling request
        await longPollManager.handleLongPoll(ctx, roomId, userId);
    } catch (error) {
        logger.error('Long-poll error', error as Error, { roomId, userId });
        ctx.response.status = 500;
        ctx.response.body = { error: 'Internal server error' };
    }
});

// Get long-polling stats (for debugging)
longPollRouter.get('/api/longpoll/stats', (ctx) => {
    const stats = longPollManager.getStats();
    ctx.response.body = {
        success: true,
        data: stats,
    };
});
