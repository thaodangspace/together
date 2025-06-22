const API_BASE_URL = 'http://localhost:8061';

interface CreateRoomResponse {
    success: boolean;
    data?: {
        roomId: string;
        userId: string;
        room: {
            id: string;
            name: string;
            owner_id: string;
        };
    };
    error?: string;
}

interface JoinRoomResponse {
    success: boolean;
    data?: {
        userId: string;
        room: {
            id: string;
            name: string;
            owner_id: string;
            current_video: any;
            queue: any[];
            users: any[];
            users_count: number;
        };
    };
    error?: string;
}

class RoomAPI {
    async createRoom(name: string, username: string): Promise<CreateRoomResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, username }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Create room error:', error);
            return { success: false, error: 'Failed to create room' };
        }
    }

    async joinRoom(roomId: string, username: string): Promise<JoinRoomResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Join room error:', error);
            return { success: false, error: 'Failed to join room' };
        }
    }
}

export const roomAPI = new RoomAPI();
