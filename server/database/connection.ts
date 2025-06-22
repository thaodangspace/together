// @ts-ignore: Deno global is available in Deno runtime
declare const Deno: any;

import { logger } from '../utils/logger.ts';

interface Room {
    id: string;
    name: string;
    owner_id: string;
    current_video_id?: string;
    current_video_url?: string;
    current_video_title?: string;
    current_video_duration?: number;
    current_position: number;
    is_playing: boolean;
    last_updated: string;
    created_at: string;
    max_users: number;
}

interface User {
    id: string;
    username: string;
    room_id?: string;
    is_online: boolean;
    joined_at: string;
    last_seen: string;
}

interface QueueItem {
    id: string;
    room_id: string;
    video_id: string;
    video_url: string;
    video_title?: string;
    video_duration?: number;
    video_thumbnail?: string;
    added_by: string;
    position: number;
    added_at: string;
}

interface Message {
    id: string;
    room_id: string;
    user_id: string;
    username: string;
    content: string;
    message_type: string;
    created_at: string;
}

export class DatabaseManager {
    private static kv: Deno.Kv | null = null;

    static async initialize(): Promise<void> {
        if (this.kv) return;

        const dbPath = Deno.env.get('KV_DATABASE_URL');
        this.kv = await Deno.openKv(dbPath);

        logger.info('Deno KV database connected', { path: dbPath || 'default' });
    }

    static getKv(): Deno.Kv {
        if (!this.kv) {
            throw new Error('Database not initialized. Call DatabaseManager.initialize() first.');
        }
        return this.kv;
    }

    // Room operations
    static async createRoom(room: Room): Promise<void> {
        const kv = this.getKv();
        await kv.set(['rooms', room.id], room);
    }

    static async getRoom(roomId: string): Promise<Room | null> {
        const kv = this.getKv();
        const result = await kv.get<Room>(['rooms', roomId]);
        return result.value;
    }

    static async updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
        const kv = this.getKv();
        const existing = await this.getRoom(roomId);
        if (!existing) throw new Error('Room not found');

        const updated = { ...existing, ...updates, last_updated: new Date().toISOString() };
        await kv.set(['rooms', roomId], updated);
    }

    static async deleteRoom(roomId: string): Promise<void> {
        const kv = this.getKv();
        await kv.delete(['rooms', roomId]);
        // Clean up related data
        await this.deleteUsersByRoom(roomId);
        await this.deleteQueueByRoom(roomId);
        await this.deleteMessagesByRoom(roomId);
    }

    // User operations
    static async createUser(user: User): Promise<void> {
        const kv = this.getKv();
        await kv.set(['users', user.id], user);
    }

    static async getUser(userId: string): Promise<User | null> {
        const kv = this.getKv();
        const result = await kv.get<User>(['users', userId]);
        return result.value;
    }

    static async getUsersByRoom(roomId: string): Promise<User[]> {
        const kv = this.getKv();
        const users: User[] = [];

        for await (const entry of kv.list<User>({ prefix: ['users'] })) {
            if (entry.value.room_id === roomId && entry.value.is_online) {
                users.push(entry.value);
            }
        }

        return users;
    }

    static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
        const kv = this.getKv();
        const existing = await this.getUser(userId);
        if (!existing) throw new Error('User not found');

        const updated = { ...existing, ...updates, last_seen: new Date().toISOString() };
        await kv.set(['users', userId], updated);
    }

    static async deleteUser(userId: string): Promise<void> {
        const kv = this.getKv();
        await kv.delete(['users', userId]);
    }

    static async deleteUsersByRoom(roomId: string): Promise<void> {
        const kv = this.getKv();
        const users = await this.getUsersByRoom(roomId);

        for (const user of users) {
            await kv.delete(['users', user.id]);
        }
    }

    // Queue operations
    static async addToQueue(item: QueueItem): Promise<void> {
        const kv = this.getKv();
        await kv.set(['queue', item.room_id, item.id], item);
    }

    static async getQueue(roomId: string): Promise<QueueItem[]> {
        const kv = this.getKv();
        const queue: QueueItem[] = [];

        for await (const entry of kv.list<QueueItem>({ prefix: ['queue', roomId] })) {
            queue.push(entry.value);
        }

        return queue.sort((a, b) => a.position - b.position);
    }

    static async updateQueueItem(
        roomId: string,
        itemId: string,
        updates: Partial<QueueItem>
    ): Promise<void> {
        const kv = this.getKv();
        const result = await kv.get<QueueItem>(['queue', roomId, itemId]);
        if (!result.value) throw new Error('Queue item not found');

        const updated = { ...result.value, ...updates };
        await kv.set(['queue', roomId, itemId], updated);
    }

    static async deleteQueueItem(roomId: string, itemId: string): Promise<void> {
        const kv = this.getKv();
        await kv.delete(['queue', roomId, itemId]);
    }

    static async deleteQueueByRoom(roomId: string): Promise<void> {
        const kv = this.getKv();

        for await (const entry of kv.list({ prefix: ['queue', roomId] })) {
            await kv.delete(entry.key);
        }
    }

    // Message operations
    static async createMessage(message: Message): Promise<void> {
        const kv = this.getKv();
        await kv.set(['messages', message.room_id, message.id], message);
    }

    static async getMessages(roomId: string, limit = 50, offset = 0): Promise<Message[]> {
        const kv = this.getKv();
        const messages: Message[] = [];

        for await (const entry of kv.list<Message>({ prefix: ['messages', roomId] })) {
            messages.push(entry.value);
        }

        // Sort by created_at desc, then apply limit and offset
        const sorted = messages.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return sorted.slice(offset, offset + limit).reverse();
    }

    static async deleteMessagesByRoom(roomId: string): Promise<void> {
        const kv = this.getKv();

        for await (const entry of kv.list({ prefix: ['messages', roomId] })) {
            await kv.delete(entry.key);
        }
    }

    // Helper methods to simulate SQL-like queries for compatibility
    static async query(sql: string, params: unknown[] = []): Promise<unknown[]> {
        // This is a compatibility layer for existing code
        const _kv = this.getKv();

        if (sql.includes('SELECT * FROM rooms WHERE id = ?')) {
            const room = await this.getRoom(params[0]);
            return room ? [room] : [];
        }

        if (
            sql.includes(
                'SELECT id, username, joined_at FROM users WHERE room_id = ? AND is_online = 1'
            )
        ) {
            return await this.getUsersByRoom(params[0]);
        }

        if (sql.includes('SELECT username FROM users WHERE id = ?')) {
            const user = await this.getUser(params[0]);
            return user ? [{ username: user.username }] : [];
        }

        if (sql.includes('FROM queue q') && sql.includes('ORDER BY q.position ASC')) {
            const queue = await this.getQueue(params[0]);
            // Add username for each queue item
            const enrichedQueue = [];
            for (const item of queue) {
                const user = await this.getUser(item.added_by);
                enrichedQueue.push({
                    ...item,
                    added_by_username: user?.username || 'Unknown',
                });
            }
            return enrichedQueue;
        }

        if (sql.includes('FROM messages') && sql.includes('ORDER BY created_at DESC')) {
            const limit = params[1] || 50;
            const offset = params[2] || 0;
            return await this.getMessages(params[0], limit, offset);
        }

        throw new Error(`Query not implemented: ${sql}`);
    }

    static async execute(sql: string, params: unknown[] = []): Promise<unknown> {
        const _kv = this.getKv();

        if (sql.includes('INSERT INTO rooms')) {
            const room: Room = {
                id: params[0],
                name: params[1],
                owner_id: params[2],
                current_video_id: params[3],
                current_video_url: params[4],
                current_video_title: params[5],
                current_video_duration: params[6],
                current_position: params[7] || 0,
                is_playing: params[8] || false,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString(),
                max_users: params[9] || 50,
            };
            await this.createRoom(room);
            return { lastInsertRowId: params[0] };
        }

        if (sql.includes('INSERT INTO users')) {
            const user: User = {
                id: params[0],
                username: params[1],
                room_id: params[2],
                is_online: true,
                joined_at: new Date().toISOString(),
                last_seen: new Date().toISOString(),
            };
            await this.createUser(user);
            return { lastInsertRowId: params[0] };
        }

        if (sql.includes('INSERT INTO queue')) {
            const item: QueueItem = {
                id: crypto.randomUUID(),
                room_id: params[0],
                video_id: params[1],
                video_url: params[2],
                video_title: params[3],
                video_duration: params[4],
                video_thumbnail: params[5],
                added_by: params[6],
                position: params[7],
                added_at: new Date().toISOString(),
            };
            await this.addToQueue(item);
            return { lastInsertRowId: item.id };
        }

        if (sql.includes('INSERT INTO messages') && sql.includes('RETURNING')) {
            const messageId = crypto.randomUUID();
            const now = new Date().toISOString();
            const message: Message = {
                id: messageId,
                room_id: params[0],
                user_id: params[1],
                username: params[2],
                content: params[3],
                message_type: params[4] || 'text',
                created_at: now,
            };
            await this.createMessage(message);
            return { id: messageId, created_at: now };
        }

        if (sql.includes('UPDATE rooms SET')) {
            const roomId = params[params.length - 1]; // Last param is usually the ID
            const updates: Partial<Room> = {};

            if (sql.includes('current_video_id')) {
                updates.current_video_id = params[0];
                updates.current_video_url = params[1];
                updates.current_video_title = params[2];
                updates.current_video_duration = params[3];
            }
            if (sql.includes('current_position')) {
                updates.current_position = params[0];
            }
            if (sql.includes('is_playing')) {
                updates.is_playing = params[0];
            }

            await this.updateRoom(roomId, updates);
            return { changes: 1 };
        }

        if (sql.includes('DELETE FROM queue WHERE')) {
            const roomId = params[0];
            const itemId = params[1];
            await this.deleteQueueItem(roomId, itemId);
            return { changes: 1 };
        }

        throw new Error(`Execute not implemented: ${sql}`);
    }

    static close(): void {
        if (this.kv) {
            this.kv.close();
            this.kv = null;
            logger.info('Deno KV database connection closed');
        }
    }
}
