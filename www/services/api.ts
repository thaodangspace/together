const API_BASE_URL = Deno.env.get('API_BASE_URL') || 'http://localhost:8061';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/trpc/router.ts';

const trpc = createTRPCProxyClient<AppRouter>({
    links: [httpBatchLink({ url: `${API_BASE_URL}/trpc` })],
});

interface JoinRoomResponse {
    success: boolean;
    data?: {
        userId: string;
        room: {
            id: string;
            name: string;
            owner_id: string;
            current_video: unknown;
            queue: unknown[];
            users: unknown[];
            users_count: number;
        };
    };
    error?: string;
}

interface CurrentUserResponse {
    success: boolean;
    data?: { userId: string; username: string; roomId: string };
    error?: string;
}

class RoomAPI {
    async joinRoom(username: string): Promise<JoinRoomResponse> {
        try {
            const data = await trpc.room.join.mutate({ username });
            return data as JoinRoomResponse;
        } catch (error) {
            console.error('Join room error:', error);
            return { success: false, error: 'Failed to join room' };
        }
    }

    async getCurrentUser(): Promise<CurrentUserResponse> {
        try {
            const data = await trpc.user.current.query();
            return data as CurrentUserResponse;
        } catch (error) {
            console.error('Get current user error:', error);
            return { success: false, error: 'Failed to get current user' };
        }
    }
}

export const roomAPI = new RoomAPI();
