import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Context } from './context.ts';
import { longPollManager } from '../longpoll/manager.ts';
import { YouTubeService } from '../services/YouTubeService.ts';
import { logger } from '../utils/logger.ts';

const t = initTRPC.context<Context>().create();

export const trpcRouter = t.router({
    // Room management procedures
    room: t.router({
        create: t.procedure
            .input(
                z.object({
                    name: z.string().min(1).max(100),
                    username: z.string().min(1).max(50),
                })
            )
            .mutation(({ input, ctx }) => {
                const roomId = crypto.randomUUID();
                const userId = crypto.randomUUID();

                try {
                    // Create room
                    ctx.db.execute(
                        `INSERT INTO rooms (id, name, owner_id, created_at, last_updated) 
             VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
                        [roomId, input.name, userId]
                    );

                    // Create user
                    ctx.db.execute(
                        `INSERT INTO users (id, username, room_id, joined_at, last_seen) 
             VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
                        [userId, input.username, roomId]
                    );

                    logger.info('Room created', {
                        roomId,
                        userId,
                        roomName: input.name,
                        username: input.username,
                    });

                    return {
                        success: true,
                        data: {
                            room_id: roomId,
                            user_id: userId,
                            room: {
                                id: roomId,
                                name: input.name,
                                owner_id: userId,
                                current_video: null,
                                is_playing: false,
                                users_count: 1,
                            },
                        },
                    };
                } catch (error) {
                    logger.error('Error creating room', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to create room',
                    });
                }
            }),

        join: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                    username: z.string().min(1).max(50),
                })
            )
            .mutation(({ input, ctx }) => {
                const userId = crypto.randomUUID();

                try {
                    // Check if room exists
                    const room = ctx.db.query('SELECT * FROM rooms WHERE id = ?', [
                        input.roomId,
                    ])[0];

                    if (!room) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'Room not found',
                        });
                    }

                    // Create user
                    ctx.db.execute(
                        `INSERT INTO users (id, username, room_id, joined_at, last_seen) 
             VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
                        [userId, input.username, input.roomId]
                    );

                    // Get room info with current video and queue
                    const roomInfo = this.getRoomInfo(ctx.db, input.roomId);

                    // Notify other users
                    longPollManager.notifyRoom(input.roomId, {
                        type: 'user_joined',
                        data: { userId, username: input.username },
                        timestamp: Date.now(),
                    });

                    logger.info('User joined room', {
                        roomId: input.roomId,
                        userId,
                        username: input.username,
                    });

                    return {
                        success: true,
                        data: {
                            user_id: userId,
                            room: roomInfo,
                        },
                    };
                } catch (error) {
                    if (error instanceof TRPCError) throw error;
                    logger.error('Error joining room', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to join room',
                    });
                }
            }),

        leave: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                    userId: z.string().uuid(),
                })
            )
            .mutation(({ input, ctx }) => {
                try {
                    const user = ctx.db.query(
                        'SELECT username FROM users WHERE id = ? AND room_id = ?',
                        [input.userId, input.roomId]
                    )[0];

                    if (!user) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'User not found in room',
                        });
                    }

                    // Remove user from room
                    ctx.db.execute(
                        'UPDATE users SET room_id = NULL, last_seen = datetime("now") WHERE id = ?',
                        [input.userId]
                    );

                    // Notify other users
                    longPollManager.notifyRoom(input.roomId, {
                        type: 'user_left',
                        data: { userId: input.userId, username: user.username },
                        timestamp: Date.now(),
                    });

                    logger.info('User left room', { roomId: input.roomId, userId: input.userId });

                    return { success: true };
                } catch (error) {
                    if (error instanceof TRPCError) throw error;
                    logger.error('Error leaving room', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to leave room',
                    });
                }
            }),

        getInfo: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                })
            )
            .query(({ input, ctx }) => {
                try {
                    const roomInfo = this.getRoomInfo(ctx.db, input.roomId);
                    return { success: true, data: roomInfo };
                } catch (error) {
                    logger.error('Error getting room info', error as Error);
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Room not found',
                    });
                }
            }),
    }),

    // Video control procedures
    video: t.router({
        updateState: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                    userId: z.string().uuid(),
                    isPlaying: z.boolean(),
                    position: z.number().min(0),
                })
            )
            .mutation(({ input, ctx }) => {
                try {
                    // Update room state
                    ctx.db.execute(
                        `UPDATE rooms SET 
             current_position = ?, 
             is_playing = ?, 
             last_updated = datetime('now') 
             WHERE id = ?`,
                        [input.position, input.isPlaying, input.roomId]
                    );

                    // Notify other users
                    longPollManager.notifyRoom(input.roomId, {
                        type: 'video_state_changed',
                        data: {
                            isPlaying: input.isPlaying,
                            position: input.position,
                            updatedBy: input.userId,
                            timestamp: Date.now(),
                        },
                        timestamp: Date.now(),
                    });

                    logger.debug('Video state updated', {
                        roomId: input.roomId,
                        userId: input.userId,
                        isPlaying: input.isPlaying,
                        position: input.position,
                    });

                    return { success: true };
                } catch (error) {
                    logger.error('Error updating video state', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to update video state',
                    });
                }
            }),

        next: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                    userId: z.string().uuid(),
                })
            )
            .mutation(({ input, ctx }) => {
                try {
                    // Get next video from queue
                    const nextVideo = ctx.db.query(
                        'SELECT * FROM queue WHERE room_id = ? ORDER BY position ASC LIMIT 1',
                        [input.roomId]
                    )[0];

                    if (!nextVideo) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'No videos in queue',
                        });
                    }

                    // Update room with new current video
                    ctx.db.execute(
                        `UPDATE rooms SET 
             current_video_id = ?, 
             current_video_url = ?, 
             current_video_title = ?, 
             current_video_duration = ?, 
             current_position = 0, 
             is_playing = true, 
             last_updated = datetime('now') 
             WHERE id = ?`,
                        [
                            nextVideo.video_id,
                            nextVideo.video_url,
                            nextVideo.video_title,
                            nextVideo.video_duration,
                            input.roomId,
                        ]
                    );

                    // Remove video from queue
                    ctx.db.execute('DELETE FROM queue WHERE id = ?', [nextVideo.id]);

                    // Update positions for remaining queue items
                    ctx.db.execute(
                        'UPDATE queue SET position = position - 1 WHERE room_id = ? AND position > ?',
                        [input.roomId, nextVideo.position]
                    );

                    // Notify users
                    longPollManager.notifyRoom(input.roomId, {
                        type: 'current_video_changed',
                        data: {
                            video: {
                                id: nextVideo.video_id,
                                url: nextVideo.video_url,
                                title: nextVideo.video_title,
                                duration: nextVideo.video_duration,
                                thumbnail: nextVideo.video_thumbnail,
                            },
                            updatedBy: input.userId,
                        },
                        timestamp: Date.now(),
                    });

                    logger.info('Next video started', {
                        roomId: input.roomId,
                        videoId: nextVideo.video_id,
                    });

                    return { success: true };
                } catch (error) {
                    if (error instanceof TRPCError) throw error;
                    logger.error('Error playing next video', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to play next video',
                    });
                }
            }),
    }),

    // Queue management procedures
    queue: t.router({
        add: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                    userId: z.string().uuid(),
                    videoUrl: z.string().url(),
                })
            )
            .mutation(async ({ input, ctx }) => {
                try {
                    // Validate YouTube URL
                    if (!YouTubeService.validateYouTubeUrl(input.videoUrl)) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'Invalid YouTube URL',
                        });
                    }

                    // Get video info from YouTube
                    const videoInfo = await YouTubeService.getVideoInfoFromUrl(input.videoUrl);

                    // Get user info
                    const user = ctx.db.query('SELECT username FROM users WHERE id = ?', [
                        input.userId,
                    ])[0];

                    // Get next position in queue
                    const maxPosition = ctx.db.query(
                        'SELECT COALESCE(MAX(position), 0) as max_pos FROM queue WHERE room_id = ?',
                        [input.roomId]
                    )[0];
                    const nextPosition = (maxPosition?.max_pos || 0) + 1;

                    // Add to queue
                    ctx.db.execute(
                        `INSERT INTO queue (room_id, video_id, video_url, video_title, video_duration, video_thumbnail, added_by, position, added_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                        [
                            input.roomId,
                            videoInfo.id,
                            input.videoUrl,
                            videoInfo.title,
                            videoInfo.duration,
                            videoInfo.thumbnail,
                            input.userId,
                            nextPosition,
                        ]
                    );

                    // If no current video, start playing this one
                    const room = ctx.db.query('SELECT current_video_id FROM rooms WHERE id = ?', [
                        input.roomId,
                    ])[0];
                    if (!room?.current_video_id) {
                        await this.startNextVideo(ctx.db, input.roomId, input.userId);
                    }

                    // Notify users
                    longPollManager.notifyRoom(input.roomId, {
                        type: 'queue_updated',
                        data: {
                            action: 'added',
                            video: {
                                id: videoInfo.id,
                                title: videoInfo.title,
                                duration: videoInfo.duration,
                                thumbnail: videoInfo.thumbnail,
                                addedBy: user?.username || 'Unknown',
                                position: nextPosition,
                            },
                        },
                        timestamp: Date.now(),
                    });

                    logger.info('Video added to queue', {
                        roomId: input.roomId,
                        userId: input.userId,
                        videoId: videoInfo.id,
                        title: videoInfo.title,
                    });

                    return { success: true, data: { video: videoInfo } };
                } catch (error) {
                    if (error instanceof TRPCError) throw error;
                    logger.error('Error adding video to queue', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to add video to queue',
                    });
                }
            }),

        remove: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                    userId: z.string().uuid(),
                    queueId: z.number(),
                })
            )
            .mutation(({ input, ctx }) => {
                try {
                    // Get queue item
                    const queueItem = ctx.db.query(
                        'SELECT * FROM queue WHERE id = ? AND room_id = ?',
                        [input.queueId, input.roomId]
                    )[0];

                    if (!queueItem) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'Queue item not found',
                        });
                    }

                    // Remove from queue
                    ctx.db.execute('DELETE FROM queue WHERE id = ?', [input.queueId]);

                    // Update positions for remaining items
                    ctx.db.execute(
                        'UPDATE queue SET position = position - 1 WHERE room_id = ? AND position > ?',
                        [input.roomId, queueItem.position]
                    );

                    // Notify users
                    longPollManager.notifyRoom(input.roomId, {
                        type: 'queue_updated',
                        data: {
                            action: 'removed',
                            queueId: input.queueId,
                        },
                        timestamp: Date.now(),
                    });

                    logger.info('Video removed from queue', {
                        roomId: input.roomId,
                        userId: input.userId,
                        queueId: input.queueId,
                    });

                    return { success: true };
                } catch (error) {
                    if (error instanceof TRPCError) throw error;
                    logger.error('Error removing video from queue', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to remove video from queue',
                    });
                }
            }),

        reorder: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                    userId: z.string().uuid(),
                    queueItems: z.array(
                        z.object({
                            id: z.number(),
                            position: z.number(),
                        })
                    ),
                })
            )
            .mutation(({ input, ctx }) => {
                try {
                    // Update positions for all items
                    for (const item of input.queueItems) {
                        ctx.db.execute(
                            'UPDATE queue SET position = ? WHERE id = ? AND room_id = ?',
                            [item.position, item.id, input.roomId]
                        );
                    }

                    // Notify users
                    longPollManager.notifyRoom(input.roomId, {
                        type: 'queue_updated',
                        data: {
                            action: 'reordered',
                            queueItems: input.queueItems,
                        },
                        timestamp: Date.now(),
                    });

                    logger.info('Queue reordered', { roomId: input.roomId, userId: input.userId });

                    return { success: true };
                } catch (error) {
                    logger.error('Error reordering queue', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to reorder queue',
                    });
                }
            }),

        get: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                })
            )
            .query(({ input, ctx }) => {
                try {
                    const queue = ctx.db.query(
                        `SELECT q.*, u.username as added_by_username 
             FROM queue q 
             JOIN users u ON q.added_by = u.id 
             WHERE q.room_id = ? 
             ORDER BY q.position ASC`,
                        [input.roomId]
                    );

                    return { success: true, data: queue };
                } catch (error) {
                    logger.error('Error getting queue', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to get queue',
                    });
                }
            }),
    }),

    // Chat procedures
    chat: t.router({
        sendMessage: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                    userId: z.string().uuid(),
                    content: z.string().min(1).max(1000),
                    messageType: z.enum(['text', 'video_link', 'system']).default('text'),
                })
            )
            .mutation(async ({ input, ctx }) => {
                try {
                    // Get user info
                    const user = ctx.db.query('SELECT username FROM users WHERE id = ?', [
                        input.userId,
                    ])[0];

                    if (!user) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'User not found',
                        });
                    }

                    // Save message
                    const result = ctx.db.query(
                        `INSERT INTO messages (room_id, user_id, username, content, message_type, created_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'))
             RETURNING id, created_at`,
                        [
                            input.roomId,
                            input.userId,
                            user.username,
                            input.content,
                            input.messageType,
                        ]
                    )[0];

                    const message = {
                        id: result.id,
                        userId: input.userId,
                        username: user.username,
                        content: input.content,
                        messageType: input.messageType,
                        createdAt: result.created_at,
                    };

                    // Check if message contains YouTube link
                    if (
                        input.messageType === 'text' &&
                        YouTubeService.validateYouTubeUrl(input.content)
                    ) {
                        // Auto-add video to queue
                        try {
                            const _videoInfo = await YouTubeService.getVideoInfoFromUrl(
                                input.content
                            );
                            // Add video logic here (similar to queue.add)
                        } catch (error) {
                            logger.warn('Failed to auto-add video from chat', error as Error);
                        }
                    }

                    // Notify users
                    longPollManager.notifyRoom(input.roomId, {
                        type: 'new_message',
                        data: message,
                        timestamp: Date.now(),
                    });

                    logger.debug('Message sent', { roomId: input.roomId, userId: input.userId });

                    return { success: true, data: message };
                } catch (error) {
                    if (error instanceof TRPCError) throw error;
                    logger.error('Error sending message', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to send message',
                    });
                }
            }),

        getMessages: t.procedure
            .input(
                z.object({
                    roomId: z.string().uuid(),
                    limit: z.number().min(1).max(100).default(50),
                    offset: z.number().min(0).default(0),
                })
            )
            .query(({ input, ctx }) => {
                try {
                    const messages = ctx.db.query(
                        `SELECT id, user_id, username, content, message_type, created_at
             FROM messages 
             WHERE room_id = ? 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
                        [input.roomId, input.limit, input.offset]
                    );

                    return { success: true, data: messages.reverse() };
                } catch (error) {
                    logger.error('Error getting messages', error as Error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to get messages',
                    });
                }
            }),
    }),

    // Helper methods
    getRoomInfo: (db: unknown, roomId: string) => {
        const room = db.query('SELECT * FROM rooms WHERE id = ?', [roomId])[0];
        if (!room) throw new Error('Room not found');

        const users = db.query(
            'SELECT id, username, joined_at FROM users WHERE room_id = ? AND is_online = 1',
            [roomId]
        );

        const queue = db.query(
            `SELECT q.*, u.username as added_by_username 
       FROM queue q 
       JOIN users u ON q.added_by = u.id 
       WHERE q.room_id = ? 
       ORDER BY q.position ASC`,
            [roomId]
        );

        return {
            id: room.id,
            name: room.name,
            owner_id: room.owner_id,
            current_video: room.current_video_id
                ? {
                      id: room.current_video_id,
                      url: room.current_video_url,
                      title: room.current_video_title,
                      duration: room.current_video_duration,
                      position: room.current_position,
                      is_playing: room.is_playing,
                  }
                : null,
            queue,
            users,
            users_count: users.length,
        };
    },

    startNextVideo: (db: unknown, roomId: string, userId: string) => {
        const nextVideo = db.query(
            'SELECT * FROM queue WHERE room_id = ? ORDER BY position ASC LIMIT 1',
            [roomId]
        )[0];

        if (nextVideo) {
            // Update room with new current video
            db.execute(
                `UPDATE rooms SET 
         current_video_id = ?, 
         current_video_url = ?, 
         current_video_title = ?, 
         current_video_duration = ?, 
         current_position = 0, 
         is_playing = true, 
         last_updated = datetime('now') 
         WHERE id = ?`,
                [
                    nextVideo.video_id,
                    nextVideo.video_url,
                    nextVideo.video_title,
                    nextVideo.video_duration,
                    roomId,
                ]
            );

            // Remove from queue
            db.execute('DELETE FROM queue WHERE id = ?', [nextVideo.id]);

            // Update positions
            db.execute(
                'UPDATE queue SET position = position - 1 WHERE room_id = ? AND position > ?',
                [roomId, nextVideo.position]
            );

            // Notify users
            longPollManager.notifyRoom(roomId, {
                type: 'current_video_changed',
                data: {
                    video: {
                        id: nextVideo.video_id,
                        url: nextVideo.video_url,
                        title: nextVideo.video_title,
                        duration: nextVideo.video_duration,
                        thumbnail: nextVideo.video_thumbnail,
                    },
                    updatedBy: userId,
                },
                timestamp: Date.now(),
            });
        }
    },
});

export type AppRouter = typeof trpcRouter;
