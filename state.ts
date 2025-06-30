export interface User {
  id: string;
  username: string;
}

export interface Message {
  id: number;
  username: string;
  content: string;
  timestamp: number;
}

export interface VideoState {
  videoId: string | null;
  position: number;
  playing: boolean;
}

export interface QueueItem {
  id: string;
  url: string;
  title: string;
}

export interface RoomState {
  users: User[];
  messages: Message[];
  queue: QueueItem[];
  video: VideoState;
}

export const state: RoomState = {
  users: [],
  messages: [],
  queue: [],
  video: { videoId: null, position: 0, playing: false },
};

export const eventTarget = new EventTarget();
