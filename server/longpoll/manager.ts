import { Context } from 'oak';
import { logger } from '../utils/logger.ts';

interface PendingRequest {
    context: Context;
    roomId: string;
    userId: string;
    timestamp: number;
    resolve: (value?: any) => void;
}

interface RoomEvent {
    type: string;
    data: any;
    timestamp: number;
}

export class LongPollManager {
    private pendingRequests = new Map<string, PendingRequest[]>();
    private readonly TIMEOUT = 25000; // 25 seconds
    private cleanupInterval?: number;

    constructor() {
        this.startCleanup();
    }

    async handleLongPoll(ctx: Context, roomId: string, userId: string): Promise<void> {
        return new Promise((resolve) => {
            const request: PendingRequest = {
                context: ctx,
                roomId,
                userId,
                timestamp: Date.now(),
                resolve,
            };

            // Add to pending requests
            if (!this.pendingRequests.has(roomId)) {
                this.pendingRequests.set(roomId, []);
            }
            this.pendingRequests.get(roomId)!.push(request);

            logger.debug('Long-poll request added', { roomId, userId });

            // Set timeout
            const timeoutId = setTimeout(() => {
                this.removePendingRequest(roomId, request);
                ctx.response.status = 204; // No Content
                logger.debug('Long-poll timeout', { roomId, userId });
                resolve();
            }, this.TIMEOUT);

            // Store timeout ID for cleanup
            (request as any).timeoutId = timeoutId;
        });
    }

    notifyRoom(roomId: string, event: RoomEvent): void {
        logger.debug('Notifying room', { roomId, eventType: event.type });

        const pending = this.pendingRequests.get(roomId) || [];

        // Send event to all pending requests in this room
        pending.forEach((request) => {
            try {
                clearTimeout((request as any).timeoutId);
                request.context.response.status = 200;
                request.context.response.body = event;
                request.context.response.headers.set('Content-Type', 'application/json');
                request.resolve();
            } catch (error) {
                logger.error('Error sending long-poll response', error, {
                    roomId,
                    userId: request.userId,
                });
            }
        });

        // Clear all pending requests for this room
        this.pendingRequests.set(roomId, []);

        logger.debug('Room notified', { roomId, notifiedCount: pending.length });
    }

    private removePendingRequest(roomId: string, request: PendingRequest): void {
        const pending = this.pendingRequests.get(roomId) || [];
        const index = pending.indexOf(request);
        if (index > -1) {
            pending.splice(index, 1);
            if (pending.length === 0) {
                this.pendingRequests.delete(roomId);
            } else {
                this.pendingRequests.set(roomId, pending);
            }
        }
    }

    // Cleanup old requests periodically
    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;

            for (const [roomId, requests] of this.pendingRequests.entries()) {
                const validRequests = requests.filter((req) => {
                    const isValid = now - req.timestamp < this.TIMEOUT + 5000;
                    if (!isValid) {
                        clearTimeout((req as any).timeoutId);
                        cleanedCount++;
                    }
                    return isValid;
                });

                if (validRequests.length === 0) {
                    this.pendingRequests.delete(roomId);
                } else {
                    this.pendingRequests.set(roomId, validRequests);
                }
            }

            if (cleanedCount > 0) {
                logger.debug('Cleaned up old long-poll requests', { cleanedCount });
            }
        }, 30000); // Cleanup every 30 seconds
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Clean up all pending requests
        for (const [, requests] of this.pendingRequests.entries()) {
            requests.forEach((req) => {
                clearTimeout((req as any).timeoutId);
                req.context.response.status = 503;
                req.context.response.body = { error: 'Server shutting down' };
                req.resolve();
            });
        }

        this.pendingRequests.clear();
        logger.info('Long-poll manager destroyed');
    }

    getStats(): { totalRooms: number; totalPendingRequests: number } {
        let totalRequests = 0;
        for (const requests of this.pendingRequests.values()) {
            totalRequests += requests.length;
        }

        return {
            totalRooms: this.pendingRequests.size,
            totalPendingRequests: totalRequests,
        };
    }
}

// Global instance
export const longPollManager = new LongPollManager();
