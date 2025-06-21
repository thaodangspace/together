import axios from 'axios';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Room {
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

export interface User {
    id: string;
    username: string;
    room_id?: string;
    is_online: boolean;
    joined_at: string;
    last_seen: string;
}

export interface RoomState {
    room: Room;
    users: User[];
    queue: unknown[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export const roomAPI = {
    async createRoom(
        name: string,
        username: string
    ): Promise<ApiResponse<{ room_id: string; user_id: string; room: Room }>> {
        const response = await api.post('/api/rooms', { name, username });
        return response.data;
    },

    async joinRoom(
        roomId: string,
        username: string
    ): Promise<ApiResponse<{ user_id: string; room: Room }>> {
        const response = await api.post(`/api/rooms/${roomId}/join`, { username });
        return response.data;
    },

    async getRoomState(roomId: string): Promise<ApiResponse<RoomState>> {
        const response = await api.get(`/api/rooms/${roomId}`);
        return response.data;
    },

    async leaveRoom(roomId: string, userId: string): Promise<ApiResponse<unknown>> {
        const response = await api.delete(`/api/rooms/${roomId}/leave`, {
            headers: { 'x-user-id': userId },
        });
        return response.data;
    },

    async longPoll(roomId: string, userId: string): Promise<{ type?: string; data?: unknown }> {
        try {
            const response = await api.get(`/api/rooms/${roomId}/poll`, {
                params: { userId },
                timeout: 30000, // 30 second timeout for long-polling
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
                // Timeout is expected for long-polling
                return { type: 'timeout' };
            }
            throw error;
        }
    },
};

export const healthAPI = {
    async checkHealth(): Promise<ApiResponse<unknown>> {
        const response = await api.get('/api/health');
        return response.data;
    },
};

export default api;
