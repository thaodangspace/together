# Kế hoạch phát triển Webapp xem video/nghe nhạc YouTube cùng nhau

## 1. Phân tích yêu cầu và thiết kế kiến trúc hệ thống

### 1.1. Yêu cầu chức năng

*   **Tạo/Tham gia phòng (Room):**
    *   Người dùng có thể tạo phòng mới.
    *   Người dùng có thể tham gia phòng hiện có thông qua một ID phòng hoặc link mời.
    *   Mỗi phòng có thể có nhiều người dùng.

*   **Đồng bộ hóa phát video/nhạc YouTube:**
    *   Tất cả người dùng trong cùng một phòng sẽ xem/nghe cùng một video/bài hát YouTube.
    *   Đồng bộ hóa trạng thái phát (play/pause), thời gian hiện tại của video.
    *   Khi một người dùng thay đổi trạng thái phát hoặc tua video, trạng thái đó sẽ được đồng bộ hóa cho tất cả người dùng khác trong phòng.

*   **Hàng đợi (Queue List):**
    *   Người dùng có thể thêm video/bài hát YouTube vào hàng đợi của phòng.
    *   Hàng đợi hiển thị danh sách các video/bài hát sẽ được phát tiếp theo.
    *   Người dùng có thể sắp xếp lại thứ tự trong hàng đợi (ví dụ: kéo thả).
    *   Người dùng có thể xóa video khỏi hàng đợi.

*   **Chat:**
    *   Người dùng trong phòng có thể trò chuyện với nhau thông qua tin nhắn văn bản.
    *   Hỗ trợ gửi link YouTube trực tiếp vào chat để thêm vào hàng đợi.

*   **Quản lý người dùng trong phòng:**
    *   Hiển thị danh sách người dùng hiện có trong phòng.
    *   Có thể có vai trò (ví dụ: chủ phòng có quyền quản lý hàng đợi, kick người dùng).

### 1.2. Yêu cầu phi chức năng

*   **Hiệu suất:** Hệ thống phải có khả năng xử lý đồng thời nhiều phòng và nhiều người dùng trong mỗi phòng mà không bị giật lag.
*   **Độ tin cậy:** Đảm bảo đồng bộ hóa chính xác trạng thái phát giữa các người dùng.
*   **Bảo mật:** Bảo vệ thông tin người dùng và phòng.
*   **Khả năng mở rộng:** Kiến trúc hệ thống phải dễ dàng mở rộng khi số lượng người dùng tăng lên.
*   **Công nghệ:**
    *   Backend: Deno.js
    *   Frontend: React.js
    *   Real-time communication: WebSockets

### 1.3. Kiến trúc hệ thống tổng quan

Kiến trúc hệ thống sẽ bao gồm ba thành phần chính:

1.  **Frontend (React.js):** Giao diện người dùng, nơi người dùng tương tác với ứng dụng.
2.  **Backend (Deno.js):** Xử lý logic nghiệp vụ, quản lý trạng thái phòng, người dùng, hàng đợi và giao tiếp với YouTube API.
3.  **Real-time Communication (tRPC với Long-Polling):** Kênh giao tiếp hai chiều giữa frontend và backend để đồng bộ hóa trạng thái phát video và tin nhắn chat tức thì.

```mermaid
graph TD
    A[Người dùng] -->|Truy cập| B(Frontend - Astro)
    B -->|HTTP/S API Requests| C(Backend - Deno.js)
    B -->|Long-Polling Requests| C
    C -->|YouTube Data API| D[YouTube]
    C -->|Database| E[Cơ sở dữ liệu]
    E -->|Lưu trữ dữ liệu| C
```

**Giải *   **Frontend (Astro):** Sẽ chịu trách nhiệm hiển thị giao diện người dùng, nơi người dùng tương tác với ứng dụng. Astro sẽ giúp tối ưu hóa hiệu suất bằng cách chỉ gửi JavaScript cần thiết cho các thành phần tương tác, trong khi phần lớn trang được render dưới dạng HTML tĩnh. Frontend sẽ gửi yêu cầu tRPC đến backend để thực hiện các thao tác như tạo/tham gia phòng, thêm video vào hàng đợi. Đồng thời, nó sẽ duy trì Long-Polling requests với backend để nhận các cập nhật trạng thái phát video và tin nhắn chat theo thời gian thực.*   **Backend:** Sẽ là trung tâm xử lý mọi logic. Nó sẽ quản lý các phòng, người dùng trong phòng, hàng đợi video. Khi có yêu cầu thay đổi trạng thái phát video từ một người dùng, backend sẽ nhận yêu cầu đó qua tRPC, xử lý và sau đó thông báo cho tất cả các Long-Polling requests đang chờ trong cùng phòng. Backend cũng sẽ tương tác với YouTube Data API để lấy thông tin video (tiêu đề, thumbnail, thời lượng) dựa trên URL.
*   **Real-time Communication (tRPC với Long-Polling):** Đây là thành phần quan trọng để đảm bảo trải nghiệm đồng bộ hóa. Thay vì sử dụng WebSocket, Long-Polling cho phép backend đẩy dữ liệu đến frontend khi có sự kiện xảy ra (ví dụ: video play/pause, tin nhắn chat mới) mà vẫn sử dụng HTTP requests thông thường, đơn giản hóa việc triển khai và debugging.
*   **Database:** Lưu trữ thông tin về phòng, người dùng, hàng đợi video, lịch sử chat (tùy chọn).
*   **YouTube Data API:** Được sử dụng để xác thực URL YouTube, lấy thông tin chi tiết về video (tiêu đề, thời lượng, thumbnail) để hiển thị trong hàng đợi và giao diện người dùng.




## 2. Thiết kế Database Schema và API Endpoints

### 2.1. Database Schema

Hệ thống sẽ sử dụng cơ sở dữ liệu quan hệ (có thể là SQLite cho development hoặc PostgreSQL cho production) với các bảng sau:

#### 2.1.1. Bảng Rooms (Phòng)
```sql
CREATE TABLE rooms (
    id VARCHAR(36) PRIMARY KEY,           -- UUID của phòng
    name VARCHAR(255) NOT NULL,           -- Tên phòng
    owner_id VARCHAR(36) NOT NULL,        -- ID của người tạo phòng
    current_video_id VARCHAR(255),        -- ID video YouTube hiện tại
    current_video_url VARCHAR(500),       -- URL video YouTube hiện tại
    current_video_title VARCHAR(500),     -- Tiêu đề video hiện tại
    current_video_duration INTEGER,       -- Thời lượng video (giây)
    current_position DECIMAL(10,3),       -- Vị trí hiện tại của video (giây)
    is_playing BOOLEAN DEFAULT FALSE,     -- Trạng thái phát video
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    max_users INTEGER DEFAULT 50         -- Số lượng người dùng tối đa
);
```

#### 2.1.2. Bảng Users (Người dùng)
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,          -- UUID của người dùng
    username VARCHAR(100) NOT NULL,      -- Tên hiển thị
    room_id VARCHAR(36),                 -- ID phòng hiện tại (NULL nếu không trong phòng nào)
    is_online BOOLEAN DEFAULT TRUE,      -- Trạng thái online
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);
```

#### 2.1.3. Bảng Queue (Hàng đợi video)
```sql
CREATE TABLE queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id VARCHAR(36) NOT NULL,        -- ID phòng
    video_id VARCHAR(255) NOT NULL,      -- ID video YouTube
    video_url VARCHAR(500) NOT NULL,     -- URL video YouTube
    video_title VARCHAR(500),            -- Tiêu đề video
    video_duration INTEGER,              -- Thời lượng video (giây)
    video_thumbnail VARCHAR(500),        -- URL thumbnail
    added_by VARCHAR(36) NOT NULL,       -- ID người thêm video
    position INTEGER NOT NULL,           -- Vị trí trong hàng đợi
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 2.1.4. Bảng Messages (Tin nhắn chat)
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id VARCHAR(36) NOT NULL,        -- ID phòng
    user_id VARCHAR(36) NOT NULL,        -- ID người gửi
    username VARCHAR(100) NOT NULL,      -- Tên người gửi (để tránh join)
    content TEXT NOT NULL,               -- Nội dung tin nhắn
    message_type VARCHAR(20) DEFAULT 'text', -- Loại tin nhắn: 'text', 'video_link', 'system'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2.2. API Endpoints

#### 2.2.1. Room Management APIs

**POST /api/rooms**
- Mô tả: Tạo phòng mới
- Request Body:
```json
{
    "name": "Phòng của tôi",
    "username": "Tên người dùng"
}
```
- Response:
```json
{
    "success": true,
    "data": {
        "room_id": "uuid-room-id",
        "user_id": "uuid-user-id",
        "room": {
            "id": "uuid-room-id",
            "name": "Phòng của tôi",
            "owner_id": "uuid-user-id",
            "current_video": null,
            "is_playing": false,
            "users_count": 1
        }
    }
}
```

**POST /api/rooms/{room_id}/join**
- Mô tả: Tham gia phòng
- Request Body:
```json
{
    "username": "Tên người dùng"
}
```
- Response:
```json
{
    "success": true,
    "data": {
        "user_id": "uuid-user-id",
        "room": {
            "id": "uuid-room-id",
            "name": "Phòng của tôi",
            "current_video": {
                "id": "youtube-video-id",
                "url": "https://youtube.com/watch?v=...",
                "title": "Tiêu đề video",
                "duration": 240,
                "position": 120.5,
                "is_playing": true
            },
            "queue": [...],
            "users": [...]
        }
    }
}
```

**GET /api/rooms/{room_id}**
- Mô tả: Lấy thông tin phòng
- Response: Tương tự như join room

**DELETE /api/rooms/{room_id}/leave**
- Mô tả: Rời khỏi phòng
- Headers: `Authorization: Bearer {user_id}`
- Response:
```json
{
    "success": true,
    "message": "Đã rời khỏi phòng"
}
```

#### 2.2.2. Video Control APIs

**POST /api/rooms/{room_id}/video/play**
- Mô tả: Phát video
- Headers: `Authorization: Bearer {user_id}`
- Request Body:
```json
{
    "position": 120.5
}
```

**POST /api/rooms/{room_id}/video/pause**
- Mô tả: Tạm dừng video
- Headers: `Authorization: Bearer {user_id}`
- Request Body:
```json
{
    "position": 120.5
}
```

**POST /api/rooms/{room_id}/video/seek**
- Mô tả: Tua video đến vị trí cụ thể
- Headers: `Authorization: Bearer {user_id}`
- Request Body:
```json
{
    "position": 180.0
}
```

**POST /api/rooms/{room_id}/video/next**
- Mô tả: Chuyển sang video tiếp theo trong hàng đợi
- Headers: `Authorization: Bearer {user_id}`

#### 2.2.3. Queue Management APIs

**GET /api/rooms/{room_id}/queue**
- Mô tả: Lấy danh sách hàng đợi
- Response:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "video_id": "youtube-video-id",
            "video_url": "https://youtube.com/watch?v=...",
            "video_title": "Tiêu đề video",
            "video_duration": 240,
            "video_thumbnail": "https://img.youtube.com/vi/.../maxresdefault.jpg",
            "added_by": "uuid-user-id",
            "added_by_username": "Tên người dùng",
            "position": 1,
            "added_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

**POST /api/rooms/{room_id}/queue**
- Mô tả: Thêm video vào hàng đợi
- Headers: `Authorization: Bearer {user_id}`
- Request Body:
```json
{
    "video_url": "https://youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**PUT /api/rooms/{room_id}/queue/reorder**
- Mô tả: Sắp xếp lại thứ tự hàng đợi
- Headers: `Authorization: Bearer {user_id}`
- Request Body:
```json
{
    "queue_items": [
        {"id": 2, "position": 1},
        {"id": 1, "position": 2},
        {"id": 3, "position": 3}
    ]
}
```

**DELETE /api/rooms/{room_id}/queue/{queue_id}**
- Mô tả: Xóa video khỏi hàng đợi
- Headers: `Authorization: Bearer {user_id}`

#### 2.2.4. Chat APIs

**GET /api/rooms/{room_id}/messages**
- Mô tả: Lấy lịch sử tin nhắn
- Query Parameters: `?limit=50&offset=0`
- Response:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "user_id": "uuid-user-id",
            "username": "Tên người dùng",
            "content": "Hello everyone!",
            "message_type": "text",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

**POST /api/rooms/{room_id}/messages**
- Mô tả: Gửi tin nhắn
- Headers: `Authorization: Bearer {user_id}`
- Request Body:
```json
{
    "content": "Hello everyone!",
    "message_type": "text"
}
```

#### 2.2.5. YouTube Integration APIs

**POST /api/youtube/video-info**
- Mô tả: Lấy thông tin video YouTube từ URL
- Request Body:
```json
{
    "video_url": "https://youtube.com/watch?v=dQw4w9WgXcQ"
}
```
- Response:
```json
{
    "success": true,
    "data": {
        "video_id": "dQw4w9WgXcQ",
        "title": "Rick Astley - Never Gonna Give You Up",
        "duration": 212,
        "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    }
}
```
### 2.3. tRPC Procedures (Long-Polling cho Real-time)

Thay vì sử dụng WebSocket, chúng ta sẽ sử dụng tRPC để định nghĩa các procedures cho phép frontend gọi các hàm trên backend một cách type-safe. Đối với các cập nhật real-time, chúng ta sẽ triển khai cơ chế Long-Polling.

#### 2.3.1. Long-Polling Mechanism

Frontend sẽ gửi một request Long-Polling đến backend và giữ kết nối mở. Backend sẽ giữ request này cho đến khi có dữ liệu mới để gửi hoặc một timeout nhất định (ví dụ: 25 giây) xảy ra. Khi có dữ liệu mới, backend sẽ trả về dữ liệu đó và đóng kết nối. Frontend sau đó sẽ ngay lập tức gửi một request Long-Polling mới để chờ đợi các cập nhật tiếp theo.

**Backend (Deno.js) - Long-Polling Endpoint Example:**
```typescript
import { Application, Router, Context } from 'oak';
import { EventEmitter } from 'https://deno.land/std@0.200.0/node/events.ts';

const eventEmitter = new EventEmitter();

// Store pending Long-Polling requests
const pendingRequests = new Map<string, Context>();

// Function to notify clients of new events
export function notifyRoomEvent(roomId: string, eventType: string, data: any) {
  const event = { eventType, data, timestamp: Date.now() };
  eventEmitter.emit(roomId, event);
  
  // If there's a pending request for this room, fulfill it immediately
  if (pendingRequests.has(roomId)) {
    const ctx = pendingRequests.get(roomId)!;
    ctx.response.body = event;
    ctx.response.type = 'application/json';
    pendingRequests.delete(roomId);
  }
}

// Long-Polling endpoint
router.get('/api/rooms/:roomId/poll', async (ctx) => {
  const { roomId } = ctx.params;
  const timeout = 25000; // 25 seconds

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      if (pendingRequests.has(roomId) && pendingRequests.get(roomId) === ctx) {
        ctx.response.status = 204; // No Content
        pendingRequests.delete(roomId);
        resolve();
      }
    }, timeout);

    const listener = (event: any) => {
      clearTimeout(timeoutId);
      ctx.response.body = event;
      ctx.response.type = 'application/json';
      pendingRequests.delete(roomId);
      eventEmitter.off(roomId, listener);
      resolve();
    };

    eventEmitter.on(roomId, listener);
    pendingRequests.set(roomId, ctx);
  });
});
```

**Frontend (Astro/React Component) - Long-Polling Hook Example:**
```typescript
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export const useLongPolling = (roomId: string, onEvent: (event: any) => void) => {
  const pollRef = useRef(true);

  const poll = async () => {
    if (!pollRef.current) return;
    try {
      const response = await axios.get(`/api/rooms/${roomId}/poll`);
      if (response.status === 200) {
        onEvent(response.data);
      }
    } catch (error) {
      console.error('Long-polling error:', error);
    } finally {
      // Always re-poll after a short delay or immediately if an event was received
      setTimeout(poll, response.status === 200 ? 0 : 1000); 
    }
  };

  useEffect(() => {
    pollRef.current = true;
    poll();
    return () => { pollRef.current = false; };
  }, [roomId]);
};
```

#### 2.3.2. tRPC Procedures

Chúng ta sẽ định nghĩa các procedures cho các thao tác CRUD và các hành động khác. tRPC sẽ giúp đảm bảo type-safety giữa frontend và backend.

**Backend (Deno.js) - tRPC Router Example:**
```typescript
import { initTRPC } from '@trpc/server';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { notifyRoomEvent } from '../utils/eventEmitter.ts';

const t = initTRPC.create();

export const appRouter = t.router({
  room: t.router({
    create: t.procedure
      .input(z.object({ name: z.string(), username: z.string() }))
      .mutation(async ({ input }) => {
        // Logic to create room and user
        const newRoom = { id: 'room-id', name: input.name, owner_id: 'user-id' };
        const newUser = { id: 'user-id', username: input.username, room_id: newRoom.id };
        // ... save to DB
        return { room: newRoom, user: newUser };
      }),
    
    join: t.procedure
      .input(z.object({ roomId: z.string(), username: z.string() }))
      .mutation(async ({ input }) => {
        // Logic to join room
        const room = { id: input.roomId, name: 'Existing Room' };
        const user = { id: 'new-user-id', username: input.username, room_id: room.id };
        // ... save to DB
        notifyRoomEvent(input.roomId, 'user_joined', { userId: user.id, username: user.username });
        return { room, user };
      }),
    
    getVideoState: t.procedure
      .input(z.object({ roomId: z.string() }))
      .query(async ({ input }) => {
        // Logic to get current video state
        return { isPlaying: true, position: 120.5 };
      }),

    updateVideoState: t.procedure
      .input(z.object({ roomId: z.string(), isPlaying: z.boolean(), position: z.number() }))
      .mutation(async ({ input }) => {
        // Logic to update video state in DB
        notifyRoomEvent(input.roomId, 'video_state_changed', { 
          isPlaying: input.isPlaying, 
          position: input.position, 
          timestamp: Date.now() 
        });
        return { success: true };
      }),

    addVideoToQueue: t.procedure
      .input(z.object({ roomId: z.string(), videoUrl: z.string().url(), userId: z.string() }))
      .mutation(async ({ input }) => {
        // Logic to add video to queue
        const newQueueItem = { id: 'queue-item-id', videoUrl: input.videoUrl };
        notifyRoomEvent(input.roomId, 'queue_updated', { queue: [newQueueItem] });
        return { success: true };
      }),

    sendMessage: t.procedure
      .input(z.object({ roomId: z.string(), userId: z.string(), username: z.string(), content: z.string() }))
      .mutation(async ({ input }) => {
        // Logic to save message
        notifyRoomEvent(input.roomId, 'new_message', { 
          id: 'msg-id', 
          userId: input.userId, 
          username: input.username, 
          content: input.content, 
          createdAt: Date.now() 
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
```

**Frontend (Astro/React Component) - tRPC Client Example:**
```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../backend/src/router'; // Adjust path

export const trpc = createTRPCReact<AppRouter>();

// Usage in a React component rendered by Astro
const MyComponent = () => {
  const { mutate: createRoom } = trpc.room.create.useMutation();
  const { data: videoState } = trpc.room.getVideoState.useQuery({ roomId: 'some-room-id' });

  // Example of calling a mutation
  const handleCreateRoom = () => {
    createRoom({
      name: 'My New Room',
      username: 'JohnDoe'
    }, {
      onSuccess: (data) => {
        console.log('Room created:', data);
      },
      onError: (error) => {
        console.error('Error creating room:', error);
      },
    });
  };

  return (
    <div>
      <button onClick={handleCreateRoom}>Create Room</button>
      {videoState && <p>Current video state: {videoState.isPlaying ? 'Playing' : 'Paused'}</p>}
    </div>
  );
};

export default MyComponent;
```

**Frontend (Astro/React Component) - tRPC Provider Setup:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './utils/trpc';

// This setup would typically be done in a React component that Astro renders
// For Astro, you might pass the client down via props or context to React components

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.PUBLIC_API_URL + '/trpc',
    }),
  ],
});

interface TRPCProviderProps {
  children: React.ReactNode;
}

export const TRPCProvider: React.FC<TRPCProviderProps> = ({ children }) => {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
};

// In an Astro component, you would import and use TRPCProvider like this:
// <TRPCProvider client:load>
//   <MyReactComponent />
// </TRPCProvider>
```


## 3. Thiết kế Giao diện Người dùng và User Experience

### 3.1. Wireframes và Layout chính

#### 3.1.1. Màn hình Landing Page
**Mục đích:** Trang chủ để người dùng tạo phòng mới hoặc tham gia phòng hiện có.

**Layout:**
```
+--------------------------------------------------+
|                    HEADER                        |
|  [Logo] SyncWatch - Xem video cùng nhau         |
+--------------------------------------------------+
|                                                  |
|              HERO SECTION                        |
|    🎬 Xem video YouTube cùng bạn bè              |
|                                                  |
|  [Tạo phòng mới]    [Tham gia phòng]           |
|                                                  |
|              FEATURES                            |
|  ✓ Đồng bộ video real-time                      |
|  ✓ Chat trực tiếp                               |
|  ✓ Hàng đợi video                               |
|  ✓ Không cần đăng ký                           |
|                                                  |
+--------------------------------------------------+
|                   FOOTER                         |
+--------------------------------------------------+
```

**Components:**
- Header với logo và navigation
- Hero section với call-to-action buttons
- Feature highlights
- Modal dialogs cho tạo/tham gia phòng

#### 3.1.2. Màn hình Room (Phòng chính)
**Mục đích:** Màn hình chính nơi người dùng xem video và tương tác.

**Layout (Desktop):**
```
+--------------------------------------------------+
|  [Logo] Room: Tên phòng    [Settings] [Leave]   |
+--------------------------------------------------+
|                          |                      |
|                          |    CHAT PANEL       |
|      VIDEO PLAYER        |                      |
|                          |  [User1]: Hello!    |
|                          |  [User2]: Hi there  |
|                          |                      |
|                          |  [Type message...]  |
|                          |  [Send]             |
+---------------------------+----------------------+
|           QUEUE PANEL                            |
|  Now Playing: Video Title                        |
|  ▶ Next: Video 1         [Remove]               |
|    Next: Video 2         [Remove]               |
|    Next: Video 3         [Remove]               |
|                                                  |
|  [Add YouTube URL...]              [Add]        |
+--------------------------------------------------+
|  👥 Users (3): User1, User2, User3              |
+--------------------------------------------------+
```

**Layout (Mobile):**
```
+---------------------------+
|  Room: Tên phòng    [≡]   |
+---------------------------+
|                           |
|     VIDEO PLAYER          |
|                           |
+---------------------------+
|  [Queue] [Chat] [Users]   |
+---------------------------+
|                           |
|    ACTIVE TAB CONTENT     |
|                           |
+---------------------------+
```

### 3.2. User Experience Flow

#### 3.2.1. Luồng tạo phòng mới
1. **Landing Page:** Người dùng click "Tạo phòng mới"
2. **Modal Dialog:** Nhập tên phòng và tên hiển thị
3. **Room Creation:** Hệ thống tạo phòng và chuyển hướng
4. **Room Page:** Người dùng vào phòng với quyền chủ phòng
5. **Share Room:** Hiển thị link mời để chia sẻ với bạn bè

#### 3.2.2. Luồng tham gia phòng
1. **Landing Page:** Người dùng click "Tham gia phòng"
2. **Modal Dialog:** Nhập Room ID và tên hiển thị
3. **Room Validation:** Kiểm tra phòng có tồn tại không
4. **Room Page:** Vào phòng và đồng bộ trạng thái hiện tại

#### 3.2.3. Luồng thêm video vào hàng đợi
1. **Input URL:** Người dùng paste YouTube URL vào ô input
2. **URL Validation:** Kiểm tra URL hợp lệ và lấy thông tin video
3. **Add to Queue:** Thêm video vào cuối hàng đợi
4. **Broadcast Update:** Thông báo cho tất cả người dùng trong phòng
5. **Auto Play:** Nếu không có video nào đang phát, tự động phát video mới

#### 3.2.4. Luồng đồng bộ video
1. **User Action:** Một người dùng thực hiện hành động (play/pause/seek)
2. **Send to Server:** Gửi event qua WebSocket
3. **Server Broadcast:** Server phát sóng event đến tất cả clients khác
4. **Client Update:** Các clients khác cập nhật trạng thái video
5. **Sync Check:** Định kỳ kiểm tra đồng bộ để đảm bảo accuracy

### 3.3. Component Design System

#### 3.3.1. Color Palette
```css
:root {
  /* Primary Colors */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  
  /* Secondary Colors */
  --secondary-50: #f8fafc;
  --secondary-500: #64748b;
  --secondary-600: #475569;
  
  /* Accent Colors */
  --accent-red: #ef4444;
  --accent-green: #10b981;
  --accent-yellow: #f59e0b;
  
  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-dark: #1e293b;
  
  /* Text */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-light: #ffffff;
}
```

#### 3.3.2. Typography
```css
/* Headings */
.heading-xl { font-size: 2.5rem; font-weight: 700; }
.heading-lg { font-size: 2rem; font-weight: 600; }
.heading-md { font-size: 1.5rem; font-weight: 600; }
.heading-sm { font-size: 1.25rem; font-weight: 500; }

/* Body Text */
.text-lg { font-size: 1.125rem; line-height: 1.75; }
.text-base { font-size: 1rem; line-height: 1.5; }
.text-sm { font-size: 0.875rem; line-height: 1.25; }
.text-xs { font-size: 0.75rem; line-height: 1; }
```

#### 3.3.3. Key Components

**Button Component:**
```jsx
const Button = ({ variant, size, children, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary: "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500",
    outline: "border border-secondary-300 bg-transparent hover:bg-secondary-50 focus:ring-secondary-500"
  };
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

**Video Player Component:**
```jsx
const VideoPlayer = ({ videoId, isPlaying, currentTime, onPlay, onPause, onSeek }) => {
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      
      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center space-x-4">
          <button onClick={isPlaying ? onPause : onPlay}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={(currentTime / videoDuration) * 100}
              onChange={(e) => onSeek((e.target.value / 100) * videoDuration)}
              className="w-full"
            />
          </div>
          
          <span className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </span>
        </div>
      </div>
    </div>
  );
};
```

**Chat Component:**
```jsx
const ChatPanel = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm text-primary-600">
                {message.username}
              </span>
              <span className="text-xs text-secondary-500">
                {formatTime(message.created_at)}
              </span>
            </div>
            <p className="text-sm text-secondary-900 mt-1">
              {message.content}
            </p>
          </div>
        ))}
      </div>
      
      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button variant="primary" size="md" onClick={handleSend}>
            Gửi
          </Button>
        </div>
      </div>
    </div>
  );
};
```

**Queue Component:**
```jsx
const QueuePanel = ({ queue, currentVideo, onAddVideo, onRemoveVideo, onReorderQueue }) => {
  const [newVideoUrl, setNewVideoUrl] = useState('');
  
  return (
    <div className="space-y-4">
      {/* Current Video */}
      {currentVideo && (
        <div className="bg-primary-50 p-4 rounded-lg">
          <h3 className="font-medium text-primary-900 mb-2">Đang phát</h3>
          <div className="flex items-center space-x-3">
            <img 
              src={currentVideo.thumbnail} 
              alt={currentVideo.title}
              className="w-16 h-12 object-cover rounded"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">{currentVideo.title}</p>
              <p className="text-xs text-secondary-600">
                {formatDuration(currentVideo.duration)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Queue List */}
      <div>
        <h3 className="font-medium text-secondary-900 mb-3">Hàng đợi</h3>
        <div className="space-y-2">
          {queue.map((item, index) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
              <span className="text-sm font-medium text-secondary-600">
                {index + 1}
              </span>
              <img 
                src={item.video_thumbnail} 
                alt={item.video_title}
                className="w-12 h-9 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{item.video_title}</p>
                <p className="text-xs text-secondary-600">
                  Thêm bởi {item.added_by_username}
                </p>
              </div>
              <button 
                onClick={() => onRemoveVideo(item.id)}
                className="text-accent-red hover:text-accent-red/80"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add Video */}
      <div className="border-t pt-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            className="flex-1 px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button variant="primary" size="md" onClick={handleAddVideo}>
            Thêm
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### 3.4. Responsive Design

#### 3.4.1. Breakpoints
```css
/* Mobile First Approach */
.container {
  width: 100%;
  padding: 0 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

/* Large Desktop */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

#### 3.4.2. Mobile Adaptations
- **Tab Navigation:** Chat, Queue, và Users sẽ được hiển thị dưới dạng tabs trên mobile
- **Video Player:** Chiếm toàn bộ chiều rộng màn hình
- **Touch Gestures:** Hỗ trợ swipe để chuyển đổi giữa các tabs
- **Responsive Typography:** Font size tự động điều chỉnh theo kích thước màn hình

### 3.5. Accessibility Features

#### 3.5.1. Keyboard Navigation
- Tất cả interactive elements có thể truy cập bằng keyboard
- Focus indicators rõ ràng
- Tab order logic và intuitive

#### 3.5.2. Screen Reader Support
- Semantic HTML elements
- ARIA labels và descriptions
- Alt text cho images
- Live regions cho dynamic content updates

#### 3.5.3. Visual Accessibility
- High contrast color combinations
- Minimum font sizes
- Scalable UI elements
- Color không phải là cách duy nhất để truyền đạt thông tin

### 3.6. Animation và Micro-interactions

#### 3.6.1. Transition Effects
```css
/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

/* Hover effects */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

#### 3.6.2. Loading States
- Skeleton loaders cho video thumbnails
- Spinner animations cho API calls
- Progressive loading cho chat messages

#### 3.6.3. Real-time Feedback
- Toast notifications cho user actions
- Visual indicators cho sync status
- Typing indicators trong chat
- Online/offline status cho users


## 4. Lập kế hoạch Implementation Chi tiết

### 4.1. Tech Stack và Dependencies

#### 4.1.1. Backend (Deno.js)
```typescript
// deno.json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-write --allow-env --watch server.ts",
    "start": "deno run --allow-net --allow-read --allow-write --allow-env server.ts"
  },
  "imports": {
    "oak": "https://deno.land/x/oak@v12.6.1/mod.ts",
    "cors": "https://deno.land/x/cors@v1.2.2/mod.ts",
    "trpc": "https://esm.sh/@trpc/server@10.45.0",
    "trpc-oak": "https://esm.sh/trpc-oak@1.0.0",
    "uuid": "https://deno.land/std@0.200.0/uuid/mod.ts",
    "sqlite": "https://deno.land/x/sqlite@v3.8.0/mod.ts",
    "zod": "https://esm.sh/zod@3.22.4"
  }
}
```

**Core Dependencies:**
- **Oak Framework:** Web framework cho Deno (tương tự Express.js)
- **tRPC:** Type-safe API layer với end-to-end type safety
- **Long-Polling:** Cho real-time communication thay thế WebSocket
- **SQLite:** Database engine (có thể upgrade lên PostgreSQL sau)
- **CORS:** Cross-Origin Resource Sharing
- **UUID:** Tạo unique identifiers
- **Zod:** Schema validation và type inference

#### 4.1.2. Frontend (Astro)
```json
{
  "dependencies": {
    "@astrojs/react": "^3.0.0",
    "@astrojs/tailwind": "^5.0.0",
    "astro": "^3.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@trpc/client": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@tanstack/react-query": "^4.35.0",
    "axios": "^1.5.0",
    "react-youtube": "^10.1.0",
    "react-beautiful-dnd": "^13.1.1",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.263.1",
    "react-hot-toast": "^2.4.1",
    "zustand": "^4.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "typescript": "^5.0.2"
  }
}
```

**Core Dependencies:**
- **Astro:** Framework cho building content-focused websites
- **@astrojs/react:** Tích hợp React components vào Astro
- **@astrojs/tailwind:** Tích hợp Tailwind CSS vào Astro
- **React:** UI library cho interactive components
- **tRPC Client:** Type-safe API client với React Query integration
- **React Query:** Data fetching và caching
- **Axios:** HTTP client cho Long-Polling requests
- **React YouTube:** YouTube player component
- **React Beautiful DnD:** Drag & drop cho queue reordering
- **Tailwind CSS:** Utility-first CSS framework
- **Lucide React:** Icon library
- **React Hot Toast:** Toast notifications
- **Zustand:** State management (lightweight alternative to Redux)

### 4.2. Project Structure

#### 4.2.1. Backend Structure (Deno.js)
```
syncwatch-backend/
├── server.ts                 # Main server file
├── deno.json                # Deno configuration
├── routes/
│   ├── trpc.ts              # tRPC router setup
│   └── longpoll.ts          # Long-polling endpoints
├── trpc/
│   ├── router.ts            # Main tRPC router
│   ├── procedures/
│   │   ├── rooms.ts         # Room-related procedures
│   │   ├── queue.ts         # Queue management procedures
│   │   ├── messages.ts      # Chat message procedures
│   │   └── youtube.ts       # YouTube integration procedures
│   └── context.ts           # tRPC context setup
├── longpoll/
│   ├── manager.ts           # Long-polling connection manager
│   ├── events.ts            # Event emitter for room events
│   └── types.ts             # Long-polling event types
├── database/
│   ├── connection.ts        # Database connection setup
│   ├── migrations.ts        # Database schema migrations
│   └── models/
│       ├── Room.ts          # Room model
│       ├── User.ts          # User model
│       ├── Queue.ts         # Queue model
│       └── Message.ts       # Message model
├── services/
│   ├── YouTubeService.ts    # YouTube API integration
│   ├── RoomService.ts       # Room business logic
│   └── SyncService.ts       # Video synchronization logic
├── middleware/
│   ├── auth.ts              # Authentication middleware
│   ├── cors.ts              # CORS configuration
│   └── validation.ts        # Request validation
├── utils/
│   ├── logger.ts            # Logging utility
│   ├── errors.ts            # Error handling
│   └── helpers.ts           # Helper functions
└── types/
    ├── api.ts               # API type definitions
    ├── trpc.ts              # tRPC type definitions
    └── database.ts          # Database type definitions
```

#### 4.2.2. Frontend Structure (React.js)
`#### 4.2.2. Frontend Structure (Astro)
```
syncwatch-frontend/
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── react/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Loading.tsx
│   │   │   ├── video/
│   │   │   │   ├── VideoPlayer.tsx
│   │   │   │   ├── VideoControls.tsx
│   │   │   │   └── VideoInfo.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   └── UserList.tsx
│   │   │   └── queue/
│   │   │       ├── QueuePanel.tsx
│   │   │       ├── QueueItem.tsx
│   │   │       ├── AddVideoForm.tsx
│   │   │       └── CurrentVideo.tsx
│   │   └── astro/
│   │       ├── layout/
│   │       │   ├── BaseLayout.astro
│   │       │   ├── Header.astro
│   │       │   └── Footer.astro
│   │       └── HomePageSections.astro
│   ├── layouts/
│   │   └── MainLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── room/[id].astro
│   │   ├── create.astro
│   │   └── join.astro
│   ├── hooks/
│   │   ├── useTRPC.ts
│   │   ├── useLongPolling.ts
│   │   ├── useRoom.ts
│   │   ├── useQueue.ts
│   │   ├── useChat.ts
│   │   └── useVideoSync.ts
│   ├── services/
│   │   ├── trpc.ts          # tRPC client setup
│   │   ├── longpoll.ts      # Long-polling client
│   │   └── youtube.ts       # YouTube utilities
│   ├── store/
│   │   ├── roomStore.ts     # Room state management
│   │   ├── userStore.ts     # User state management
│   │   └── appStore.ts      # Global app state
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validation.ts
│   ├── styles/
│   │   └── global.css
│   └── env.d.ts
├── astro.config.mjs
├── package.json
├── tailwind.config.js
└── tsconfig.json
```config.js
└── tsconfig.json
```

### 4.3. Development Phases

#### 4.3.1. Phase 1: Core Infrastructure (Tuần 1-2)
**Backend Tasks:**
- [ ] Setup Deno.js project với Oak framework
- [ ] Implement database schema với SQLite
- [ ] Create basic API routes (rooms, users)
- [ ] Setup WebSocket connection handling
- [ ] Implement CORS và basic middleware

**Frontend Tasks:**
- [ ] Setup Astro project với `@astrojs/react` và `@astrojs/tailwind`
- [ ] Configure Tailwind CSS và component library
- [ ] Create basic routing với Astro pages
- [ ] Implement landing page và basic layouts
- [ ] Setup state management với Zustand (trong React components)

**Deliverables:**
- Basic server running on Deno.js
- React app với routing setup
- Database schema implemented
- Basic API endpoints working

#### 4.3.2. Phase 2: Room Management (Tuần 3-4)
**Backend Tasks:**
- [ ] Implement room creation/joining logic
- [ ] Add user management trong rooms
- [ ] Setup WebSocket room broadcasting
- [ ] Add room validation và error handling

**Frontend Tasks:**
- [ ] Create room creation/joining forms
- [ ] Implement room page layout
- [ ] Add Long-Polling connection management
- [ ] Create user list component

**Deliverables:**
- Users có thể tạo và join rooms
- Real-time user presence trong rooms
- Basic room management working

#### 4.3.3. Phase 3: Video Integration (Tuần 5-6)
**Backend Tasks:**
- [ ] Integrate YouTube Data API
- [ ] Implement video validation và metadata fetching
- [ ] Add video state synchronization logic
- [ ] Create video control WebSocket events

**Frontend Tasks:**
- [ ] Integrate React YouTube player
- [ ] Implement video controls với sync
- [ ] Add video state management
- [ ] Create video info display

**Deliverables:**
- YouTube videos có thể được phát trong rooms
- Video state được đồng bộ giữa users
- Basic video controls working

#### 4.3.4. Phase 4: Queue System (Tuần 7-8)
**Backend Tasks:**
- [ ] Implement queue database operations
- [ ] Add queue reordering logic
- [ ] Create auto-play next video functionality
- [ ] Add queue WebSocket events

**Frontend Tasks:**
- [ ] Create queue panel component
- [ ] Implement drag & drop reordering
- [ ] Add video addition form
- [ ] Create queue management UI

**Deliverables:**
- Users có thể add videos vào queue
- Queue reordering working
- Auto-play next video functionality

#### 4.3.5. Phase 5: Chat System (Tuần 9-10)
**Backend Tasks:**
- [ ] Implement chat message storage
- [ ] Add chat WebSocket events
- [ ] Create message history API
- [ ] Add YouTube link detection trong chat

**Frontend Tasks:**
- [ ] Create chat panel component
- [ ] Implement message list với scrolling
- [ ] Add message input với YouTube link detection
- [ ] Create chat notifications

**Deliverables:**
- Real-time chat working
- YouTube links trong chat add videos to queue
- Message history persistence

#### 4.3.6. Phase 6: Polish & Optimization (Tuần 11-12)
**Backend Tasks:**
- [ ] Add comprehensive error handling
- [ ] Implement rate limiting
- [ ] Add logging và monitoring
- [ ] Performance optimization

**Frontend Tasks:**
- [ ] Add loading states và error handling
- [ ] Implement responsive design
- [ ] Add animations và micro-interactions
- [ ] Cross-browser testing

**Deliverables:**
- Production-ready application
- Comprehensive error handling
- Responsive design
- Performance optimized

### 4.4. Key Implementation Details

#### 4.4.1. tRPC Integration System
```typescript
// Backend tRPC Router
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { LongPollManager } from '../longpoll/manager.ts';

const t = initTRPC.create();
const longPollManager = new LongPollManager();

export const appRouter = t.router({
  room: t.router({
    create: t.procedure
      .input(z.object({ name: z.string(), username: z.string() }))
      .mutation(async ({ input }) => {
        const room = await RoomService.create(input.name, input.username);
        return room;
      }),
    
    join: t.procedure
      .input(z.object({ roomId: z.string(), username: z.string() }))
      .mutation(async ({ input }) => {
        const result = await RoomService.join(input.roomId, input.username);
        
        // Notify other users via Long-Polling
        longPollManager.notifyRoom(input.roomId, {
          type: 'user_joined',
          data: { userId: result.user.id, username: result.user.username }
        });
        
        return result;
      }),

    updateVideoState: t.procedure
      .input(z.object({ 
        roomId: z.string(), 
        isPlaying: z.boolean(), 
        position: z.number(),
        userId: z.string()
      }))
      .mutation(async ({ input }) => {
        await RoomService.updateVideoState(input.roomId, {
          isPlaying: input.isPlaying,
          position: input.position
        });
        
        // Broadcast to all users in room via Long-Polling
        longPollManager.notifyRoom(input.roomId, {
          type: 'video_state_changed',
          data: {
            isPlaying: input.isPlaying,
            position: input.position,
            timestamp: Date.now(),
            updatedBy: input.userId
          }
        });
        
        return { success: true };
      })
  })
});

export type AppRouter = typeof appRouter;
```

#### 4.4.2. Long-Polling Manager
```typescript
// longpoll/manager.ts
import { Context } from 'oak';
import { EventEmitter } from 'https://deno.land/std@0.200.0/node/events.ts';

interface PendingRequest {
  context: Context;
  roomId: string;
  userId: string;
  timestamp: number;
}

export class LongPollManager {
  private eventEmitter = new EventEmitter();
  private pendingRequests = new Map<string, PendingRequest[]>();
  private readonly TIMEOUT = 25000; // 25 seconds
  
  async handleLongPoll(ctx: Context, roomId: string, userId: string): Promise<void> {
    return new Promise((resolve) => {
      const request: PendingRequest = {
        context: ctx,
        roomId,
        userId,
        timestamp: Date.now()
      };
      
      // Add to pending requests
      if (!this.pendingRequests.has(roomId)) {
        this.pendingRequests.set(roomId, []);
      }
      this.pendingRequests.get(roomId)!.push(request);
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.removePendingRequest(roomId, request);
        ctx.response.status = 204; // No Content
        resolve();
      }, this.TIMEOUT);
      
      // Listen for events
      const eventListener = (event: any) => {
        clearTimeout(timeoutId);
        this.removePendingRequest(roomId, request);
        ctx.response.body = event;
        ctx.response.type = 'application/json';
        this.eventEmitter.off(`room:${roomId}`, eventListener);
        resolve();
      };
      
      this.eventEmitter.on(`room:${roomId}`, eventListener);
    });
  }
  
  notifyRoom(roomId: string, event: any): void {
    // Emit event to EventEmitter
    this.eventEmitter.emit(`room:${roomId}`, event);
    
    // Also directly fulfill any pending requests
    const pending = this.pendingRequests.get(roomId) || [];
    pending.forEach(request => {
      request.context.response.body = event;
      request.context.response.type = 'application/json';
    });
    
    // Clear pending requests for this room
    this.pendingRequests.set(roomId, []);
  }
  
  private removePendingRequest(roomId: string, request: PendingRequest): void {
    const pending = this.pendingRequests.get(roomId) || [];
    const index = pending.indexOf(request);
    if (index > -1) {
      pending.splice(index, 1);
    }
  }
  
  // Cleanup old requests periodically
  startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [roomId, requests] of this.pendingRequests.entries()) {
        const validRequests = requests.filter(req => 
          now - req.timestamp < this.TIMEOUT + 5000
        );
        this.pendingRequests.set(roomId, validRequests);
      }
    }, 30000); // Cleanup every 30 seconds
  }
}
```

#### 4.4.3. Frontend Long-Polling Hook
```typescript
// hooks/useLongPolling.ts
import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

interface LongPollingEvent {
  type: string;
  data: any;
  timestamp: number;
}

export const useLongPolling = (
  roomId: string | null,
  userId: string | null,
  onEvent: (event: LongPollingEvent) => void
) => {
  const isPollingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const startPolling = useCallback(async () => {
    if (!roomId || !userId || isPollingRef.current) return;
    
    isPollingRef.current = true;
    
    while (isPollingRef.current) {
      try {
        abortControllerRef.current = new AbortController();
        
        const response = await axios.get(
          `/api/rooms/${roomId}/poll?userId=${userId}`,
          {
            timeout: 30000, // 30 second timeout
            signal: abortControllerRef.current.signal
          }
        );
        
        if (response.status === 200 && response.data) {
          onEvent(response.data);
        }
        
        // Small delay before next poll if we got data
        if (response.status === 200) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        if (axios.isCancel(error)) {
          break; // Polling was cancelled
        }
        
        console.error('Long-polling error:', error);
        
        // Wait before retrying on error
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }, [roomId, userId, onEvent]);
  
  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  
  useEffect(() => {
    if (roomId && userId) {
      startPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [roomId, userId, startPolling, stopPolling]);
  
  return { stopPolling };
};
```

#### 4.4.4. Video Synchronization với tRPC
```typescript
// hooks/useVideoSync.ts
import { useCallback } from 'react';
import { trpc } from '../services/trpc';
import { useLongPolling } from './useLongPolling';

export const useVideoSync = (roomId: string, userId: string) => {
  const updateVideoStateMutation = trpc.room.updateVideoState.useMutation();
  
  const handleVideoEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'video_state_changed':
        if (event.data.updatedBy !== userId) {
          // Only sync if the update came from another user
          const { isPlaying, position, timestamp } = event.data;
          
          // Calculate time drift and adjust position
          const timeDrift = (Date.now() - timestamp) / 1000;
          const adjustedPosition = isPlaying ? position + timeDrift : position;
          
          // Update video player state
          updateVideoPlayer(isPlaying, adjustedPosition);
        }
        break;
        
      case 'current_video_changed':
        // Handle video change
        loadNewVideo(event.data.video);
        break;
    }
  }, [userId]);
  
  // Setup Long-Polling for this room
  useLongPolling(roomId, userId, handleVideoEvent);
  
  const syncVideoState = useCallback((isPlaying: boolean, position: number) => {
    updateVideoStateMutation.mutate({
      roomId,
      userId,
      isPlaying,
      position
    });
  }, [roomId, userId, updateVideoStateMutation]);
  
  return { syncVideoState };
};
```

#### 4.4.3. YouTube URL Parsing
```typescript
// YouTube URL validation và parsing
export class YouTubeService {
  static extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }
  
  static async getVideoInfo(videoId: string) {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet,contentDetails`
    );
    
    const data = await response.json();
    if (data.items?.length > 0) {
      const video = data.items[0];
      return {
        id: videoId,
        title: video.snippet.title,
        duration: this.parseDuration(video.contentDetails.duration),
        thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high.url
      };
    }
    
    throw new Error('Video not found');
  }
  
  private static parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || '').replace('H', '') || '0';
    const minutes = (match[2] || '').replace('M', '') || '0';
    const seconds = (match[3] || '').replace('S', '') || '0';
    
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  }
}
```

### 4.5. Testing Strategy

#### 4.5.1. Backend Testing
- **Unit Tests:** Test individual functions và services
- **Integration Tests:** Test API endpoints và database operations
- **WebSocket Tests:** Test real-time communication
- **Load Tests:** Test performance với multiple concurrent users

#### 4.5.2. Frontend Testing
- **Component Tests:** Test individual React components
- **Integration Tests:** Test user flows và API integration
- **E2E Tests:** Test complete user scenarios
- **Cross-browser Tests:** Ensure compatibility

#### 4.5.3. Testing Tools
```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "vitest": "^0.34.0",
    "cypress": "^12.17.0"
  }
}
```

### 4.6. Deployment Strategy

#### 4.6.1. Development Environment
- **Backend:** Deno.js với file watching
- **Frontend:** Vite dev server với hot reload
- **Database:** SQLite local file
- **WebSocket:** Development WebSocket server

#### 4.6.2. Production Environment
- **Backend:** Deno Deploy hoặc Docker container
- **Frontend:** Vercel, Netlify, hoặc static hosting
- **Database:** PostgreSQL hoặc managed SQLite
- **WebSocket:** Production WebSocket với load balancing

#### 4.6.3. CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - run: deno test --allow-all
      
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - run: deno deploy --project=syncwatch-backend
      
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
```


## 5. Tài liệu Kỹ thuật và Hướng dẫn Triển khai

### 5.1. Hướng dẫn Setup Development Environment

#### 5.1.1. Prerequisites và System Requirements

Trước khi bắt đầu phát triển ứng dụng SyncWatch, đảm bảo hệ thống của bạn đáp ứng các yêu cầu sau:

**Hệ điều hành:** Windows 10+, macOS 10.15+, hoặc Linux (Ubuntu 18.04+)
**RAM:** Tối thiểu 8GB, khuyến nghị 16GB
**Ổ cứng:** Ít nhất 5GB dung lượng trống
**Kết nối mạng:** Stable internet connection để download dependencies

**Software Requirements:**
- **Deno:** Version 1.36+ (cho backend development)
- **Node.js:** Version 18+ (cho frontend development)
- **Git:** Version 2.25+ (cho version control)
- **VS Code:** Khuyến nghị với Deno extension
- **YouTube Data API Key:** Cần đăng ký Google Cloud Console

#### 5.1.2. Cài đặt Deno.js

Deno là runtime JavaScript/TypeScript hiện đại, bảo mật và đơn giản. Để cài đặt Deno trên các hệ điều hành khác nhau:

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

**macOS/Linux (Shell):**
```bash
curl -fsSL https://deno.land/install.sh | sh
```

**Homebrew (macOS):**
```bash
brew install deno
```

Sau khi cài đặt, verify installation bằng cách chạy:
```bash
deno --version
```

#### 5.1.3. Cài đặt Node.js và npm

Frontend sử dụng React.js, cần Node.js để manage dependencies và build process:

**Sử dụng Node Version Manager (khuyến nghị):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install và sử dụng Node.js 18
nvm install 18
nvm use 18
```

**Download trực tiếp từ nodejs.org:**
Tải và cài đặt Node.js LTS version từ https://nodejs.org/

#### 5.1.4. Setup YouTube Data API

Để integrate với YouTube, cần tạo API key từ Google Cloud Console:

1. **Truy cập Google Cloud Console:** https://console.cloud.google.com/
2. **Tạo project mới hoặc chọn existing project**
3. **Enable YouTube Data API v3:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. **Tạo API Key:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy API key để sử dụng trong application
5. **Restrict API Key (khuyến nghị):**
   - Click on created API key
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"

### 5.2. Backend Setup và Configuration

#### 5.2.1. Project Initialization

Tạo directory structure cho backend project:

```bash
mkdir syncwatch-backend
cd syncwatch-backend

# Tạo main configuration file
touch deno.json
touch server.ts
mkdir -p {routes,websocket,database,services,middleware,utils,types}
```

#### 5.2.2. Deno Configuration

Tạo file `deno.json` với configuration sau:

```json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-write --allow-env --watch server.ts",
    "start": "deno run --allow-net --allow-read --allow-write --allow-env server.ts",
    "test": "deno test --allow-all",
    "fmt": "deno fmt",
    "lint": "deno lint"
  },
  "imports": {
    "oak": "https://deno.land/x/oak@v12.6.1/mod.ts",
    "oak/cors": "https://deno.land/x/cors@v1.2.2/mod.ts",
    "std/ws": "https://deno.land/std@0.200.0/ws/mod.ts",
    "std/uuid": "https://deno.land/std@0.200.0/uuid/mod.ts",
    "sqlite": "https://deno.land/x/sqlite@v3.8.0/mod.ts",
    "dotenv": "https://deno.land/std@0.200.0/dotenv/mod.ts"
  },
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  },
  "fmt": {
    "files": {
      "include": ["src/", "tests/"]
    },
    "options": {
      "useTabs": false,
      "lineWidth": 100,
      "indentWidth": 2,
      "singleQuote": true
    }
  }
}
```

#### 5.2.3. Environment Variables

Tạo file `.env` để store sensitive configuration:

```bash
# .env
PORT=8000
DATABASE_URL=./database.db
YOUTUBE_API_KEY=your_youtube_api_key_here
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_jwt_secret_here
LOG_LEVEL=info
```

Tạo file `.env.example` để document required environment variables:

```bash
# .env.example
PORT=8000
DATABASE_URL=./database.db
YOUTUBE_API_KEY=
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=
LOG_LEVEL=info
```

#### 5.2.4. Main Server Implementation

Tạo file `server.ts` với basic server setup:

```typescript
import { Application, Router } from 'oak';
import { oakCors } from 'oak/cors';
import { load } from 'dotenv';
import { Database } from 'sqlite';

// Load environment variables
const env = await load();
const PORT = parseInt(env.PORT || '8000');

// Initialize database
const db = new Database('./database.db');

// Initialize Oak application
const app = new Application();
const router = new Router();

// Middleware
app.use(oakCors({
  origin: env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Basic health check route
router.get('/health', (ctx) => {
  ctx.response.body = { status: 'OK', timestamp: new Date().toISOString() };
});

// API routes
router.get('/api/rooms', (ctx) => {
  // Room listing logic
});

app.use(router.routes());
app.use(router.allowedMethods());

// WebSocket handling
app.use(async (ctx) => {
  if (ctx.request.url.pathname === '/ws') {
    const ws = await ctx.upgrade();
    // WebSocket logic here
  }
});

console.log(`🚀 Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });
```

#### 5.2.5. Database Setup

Tạo file `database/connection.ts` để manage database connection:

```typescript
import { Database } from 'sqlite';

export class DatabaseManager {
  private static instance: Database;
  
  static getInstance(): Database {
    if (!this.instance) {
      this.instance = new Database('./database.db');
      this.initializeTables();
    }
    return this.instance;
  }
  
  private static initializeTables() {
    const db = this.instance;
    
    // Create rooms table
    db.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        current_video_id TEXT,
        current_video_url TEXT,
        current_video_title TEXT,
        current_video_duration INTEGER,
        current_position REAL DEFAULT 0,
        is_playing BOOLEAN DEFAULT FALSE,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        max_users INTEGER DEFAULT 50
      )
    `);
    
    // Create users table
    db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        room_id TEXT,
        is_online BOOLEAN DEFAULT TRUE,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
      )
    `);
    
    // Create queue table
    db.execute(`
      CREATE TABLE IF NOT EXISTS queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        video_id TEXT NOT NULL,
        video_url TEXT NOT NULL,
        video_title TEXT,
        video_duration INTEGER,
        video_thumbnail TEXT,
        added_by TEXT NOT NULL,
        position INTEGER NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create messages table
    db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Database tables initialized'### 5.3. Frontend Setup và Configuration

#### 5.3.1. Astro Project Initialization

Sử dụng `create-astro` để tạo Astro project với React và Tailwind CSS:

```bash
npm create astro@latest syncwatch-frontend
cd syncwatch-frontend

# Chọn "Just the basics (recommended)"
# Chọn "Yes" để cài đặt dependencies
# Chọn "Yes" để tạo một dự án trống
# Chọn "Yes" để cài đặt TypeScript

# Add React integration
npx astro add react

# Add Tailwind CSS integration
npx astro add tailwind

npm install
```

#### 5.3.2. Dependencies Installation

Install required dependencies cho frontend:

```bash
# Core dependencies
npm install @trpc/client @trpc/react-query @tanstack/react-query axios react-youtube
npm install react-beautiful-dnd react-hot-toast zustand

# UI và styling (đã được cài đặt qua astro add tailwind)
# npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
# npm install lucide-react @headlessui/react

# Development dependencies
npm install -D @types/react-beautiful-dnd
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D vitest @vitejs/plugin-react
```

#### 5.3.3. Tailwind CSS Configuration

Setup Tailwind CSS cho styling (đã được `astro add tailwind` tạo ra):

Update `tailwind.config.mjs` (hoặc `tailwind.config.js`):

```javascript
/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

#### 5.3.4. Astro Configuration

Update `astro.config.mjs` để configure development server và proxy:

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/trpc': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/trpc/, '/trpc'),
      },
    },
  },
  vite: {
    optimizeDeps: {
      exclude: ['@trpc/client', '@trpc/react-query', '@tanstack/react-query'],
    },
  },
});
```

#### 5.3.5. TypeScript Configuration

Update `tsconfig.json` để improve development experience (Astro sẽ tạo file này):

```json
{
  "extends": "astro/tsconfig/base",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    },
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```kflow

#### 5.4.1. Git Workflow và Branch Strategy

Sử dụng Git Flow pattern cho development:

```bash
# Main branches
main          # Production-ready code
develop       # Integration branch for features

# Feature branches
feature/*     # New features
bugfix/*      # Bug fixes
hotfix/*      # Critical production fixes
release/*     # Release preparation
```

**Branch naming conventions:**
- `feature/video-synchronization`
- `feature/chat-system`
- `bugfix/websocket-connection-issue`
- `hotfix/security-vulnerability`

#### 5.4.2. Commit Message Convention

Sử dụng Conventional Commits format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Examples:**
```
feat(backend): add video synchronization WebSocket events
fix(frontend): resolve chat message ordering issue
docs(readme): update installation instructions
test(api): add unit tests for room management
```

#### 5.4.3. Code Quality Tools

Setup ESLint và Prettier cho code consistency:

**Frontend (.eslintrc.json):**
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

**Prettier (.prettierrc):**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

#### 5.4.4. Development Scripts

**Backend (deno.json tasks):**
```json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-write --allow-env --watch server.ts",
    "start": "deno run --allow-net --allow-read --allow-write --allow-env server.ts",
    "test": "deno test --allow-all tests/",
    "test:watch": "deno test --allow-all --watch tests/",
    "fmt": "deno fmt src/",
    "lint": "deno lint src/",
    "check": "deno check src/**/*.ts"
  }
}
```

**Frontend (package.json scripts):**
```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro start",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext ts,tsx,astro --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx,astro --fix",
    "format": "prettier --write src/**/*.{ts,tsx,astro,css,md}"
  }
}
```

### 5.5. Testing Strategy và Implementation

#### 5.5.1. Backend Testing với Deno

Tạo test files trong `tests/` directory:

**tests/room_service_test.ts:**
```typescript
import { assertEquals, assertExists } from 'https://deno.land/std@0.200.0/testing/asserts.ts';
import { RoomService } from '../services/RoomService.ts';

Deno.test('RoomService - Create Room', async () => {
  const roomService = new RoomService();
  const room = await roomService.createRoom('Test Room', 'user123');
  
  assertExists(room.id);
  assertEquals(room.name, 'Test Room');
  assertEquals(room.owner_id, 'user123');
});

Deno.test('RoomService - Join Room', async () => {
  const roomService = new RoomService();
  const room = await roomService.createRoom('Test Room', 'user123');
  const user = await roomService.joinRoom(room.id, 'user456', 'Test User');
  
  assertEquals(user.room_id, room.id);
  assertEquals(user.username, 'Test User');
});
```

**Run tests:**
```bash
deno task test
deno task test:watch  # Watch mode
```

#### 5.5.2. Frontend Testing với Vitest (trong Astro Project)

Setup Vitest configuration trong `vitest.config.ts` (Astro project cũng sử dụng Vite):

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

**src/test/setup.ts:**
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock YouTube API
global.YT = {
  Player: vi.fn(),
};
```

**Component test example (React component trong Astro):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../src/components/react/common/Button'; // Adjusted path

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### 5.5.3. End-to-End Testing với Cypress

Install và setup Cypress:

```bash
npm install -D cypress
npx cypress open
```

**cypress/e2e/room_flow.cy.ts:**
```typescript
describe('Room Flow', () => {
  it('should create and join a room', () => {
    cy.visit('/');
    
    // Create room
    cy.get('[data-testid="create-room-btn"]').click();
    cy.get('[data-testid="room-name-input"]').type('Test Room');
    cy.get('[data-testid="username-input"]').type('Test User');
    cy.get('[data-testid="create-btn"]').click();
    
    // Verify room creation
    cy.url().should('include', '/room/');
    cy.get('[data-testid="room-title"]').should('contain', 'Test Room');
    
    // Add video to queue
    cy.get('[data-testid="video-url-input"]').type('https://youtube.com/watch?v=dQw4w9WgXcQ');
    cy.get('[data-testid="add-video-btn"]').click();
    
    // Verify video added
    cy.get('[data-testid="queue-item"]').should('be.visible');
  });
});
```

### 5.6. Performance Optimization

#### 5.6.1. Backend Performance

**Database Optimization:**
```typescript
// Use database indexes for frequently queried fields
db.execute(`CREATE INDEX IF NOT EXISTS idx_rooms_owner ON rooms(owner_id)`);
db.execute(`CREATE INDEX IF NOT EXISTS idx_users_room ON users(room_id)`);
db.execute(`CREATE INDEX IF NOT EXISTS idx_queue_room ON queue(room_id, position)`);
db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at)`);

// Use prepared statements for repeated queries
const getRoomQuery = db.prepare(`
  SELECT * FROM rooms WHERE id = ?
`);

const addUserToRoomQuery = db.prepare(`
  INSERT INTO users (id, username, room_id) VALUES (?, ?, ?)
`);
```

**WebSocket Connection Pooling:**
```typescript
class WebSocketManager {
  private connections = new Map<string, Set<WebSocket>>();
  private userConnections = new Map<string, WebSocket>();
  
  addConnection(roomId: string, userId: string, ws: WebSocket) {
    // Add to room pool
    if (!this.connections.has(roomId)) {
      this.connections.set(roomId, new Set());
    }
    this.connections.get(roomId)!.add(ws);
    
    // Track user connection
    this.userConnections.set(userId, ws);
    
    // Cleanup on disconnect
    ws.onclose = () => {
      this.removeConnection(roomId, userId, ws);
    };
  }
  
  broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
    const roomConnections = this.connections.get(roomId);
    if (!roomConnections) return;
    
    const messageStr = JSON.stringify(message);
    roomConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
}
```

#### 5.6.2. Frontend Performance

**Code Splitting:**
```typescript
// Lazy load components
const RoomPage = lazy(() => import('./pages/RoomPage'));
const CreateRoomPage = lazy(() => import('./pages/CreateRoomPage'));

// Route-based code splitting
const App = () => (
  <Router>
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:id" element={<RoomPage />} />
        <Route path="/create" element={<CreateRoomPage />} />
      </Routes>
    </Suspense>
  </Router>
);
```

**Memoization và Optimization:**
```typescript
// Memoize expensive calculations
const VideoPlayer = memo(({ videoId, isPlaying, currentTime }) => {
  const playerRef = useRef<YT.Player>();
  
  // Debounce seek operations
  const debouncedSeek = useMemo(
    () => debounce((time: number) => {
      playerRef.current?.seekTo(time);
    }, 100),
    []
  );
  
  useEffect(() => {
    if (playerRef.current && Math.abs(playerRef.current.getCurrentTime() - currentTime) > 1) {
      debouncedSeek(currentTime);
    }
  }, [currentTime, debouncedSeek]);
  
  return <div id="youtube-player" />;
});

// Optimize re-renders với useCallback
const ChatPanel = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  
  const handleSend = useCallback(() => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  }, [newMessage, onSendMessage]);
  
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);
  
  return (
    <div>
      {/* Chat messages */}
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
};
```

### 5.7. Security Considerations

#### 5.7.1. Input Validation và Sanitization

**Backend Validation:**
```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Define validation schemas
const CreateRoomSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  username: z.string().min(1).max(50).trim(),
});

const AddVideoSchema = z.object({
  video_url: z.string().url().refine(url => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }, 'Must be a valid YouTube URL'),
});

// Middleware for validation
export const validateRequest = (schema: z.ZodSchema) => {
  return async (ctx: Context, next: () => Promise<void>) => {
    try {
      const body = await ctx.request.body().value;
      const validatedData = schema.parse(body);
      ctx.state.validatedData = validatedData;
      await next();
    } catch (error) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Invalid request data', details: error.errors };
    }
  };
};
```

**Frontend Validation:**
```typescript
// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// YouTube URL validation
export const validateYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
  ];
  
  return patterns.some(pattern => pattern.test(url));
};
```

#### 5.7.2. Rate Limiting

```typescript
class RateLimiter {
  private requests = new Map<string, number[]>();
  
  isAllowed(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
}

// Usage in middleware
const rateLimiter = new RateLimiter();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (ctx: Context, next: () => Promise<void>) => {
    const identifier = ctx.request.ip;
    
    if (!rateLimiter.isAllowed(identifier, maxRequests, windowMs)) {
      ctx.response.status = 429;
      ctx.response.body = { error: 'Too many requests' };
      return;
    }
    
    await next();
  };
};
```

#### 5.7.3. CORS Configuration

```typescript
// Secure CORS setup
app.use(oakCors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://syncwatch.app',
      'https://www.syncwatch.app'
    ];
    
    return allowedOrigins.includes(origin) || !origin; // Allow requests with no origin (mobile apps)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));
```


### 5.8. Deployment và Production Setup

#### 5.8.1. Production Environment Configuration

**Environment Variables cho Production:**
```bash
# .env.production
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://username:password@host:port/database
YOUTUBE_API_KEY=your_production_youtube_api_key
CORS_ORIGIN=https://syncwatch.app
JWT_SECRET=your_secure_jwt_secret_here
LOG_LEVEL=warn
REDIS_URL=redis://localhost:6379
MAX_ROOMS=1000
MAX_USERS_PER_ROOM=50
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
```

**Docker Configuration:**

**Dockerfile (Backend):**
```dockerfile
FROM denoland/deno:1.36.0

WORKDIR /app

# Copy dependency files
COPY deno.json .
COPY deno.lock .

# Cache dependencies
RUN deno cache --lock=deno.lock deps.ts

# Copy source code
COPY . .

# Cache the main module
RUN deno cache --lock=deno.lock server.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "server.ts"]
```

**Dockerfile (Frontend):**
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: ./syncwatch-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/syncwatch
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs

  frontend:
    build: ./syncwatch-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=syncwatch
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

#### 5.8.2. Cloud Deployment Options

**Option 1: Deno Deploy (Recommended cho Backend)**

Deno Deploy là serverless platform được tối ưu cho Deno applications:

```bash
# Install Deno Deploy CLI
deno install --allow-read --allow-write --allow-env --allow-net --allow-run -n deployctl https://deno.land/x/deploy/deployctl.ts

# Deploy to Deno Deploy
deployctl deploy --project=syncwatch-backend server.ts
```

**deployctl.json:**
```json
{
  "project": "syncwatch-backend",
  "entrypoint": "server.ts",
  "include": [
    "**/*.ts",
    "**/*.json",
    "database/",
    "static/"
  ],
  "exclude": [
    "tests/",
    "*.test.ts"
  ]
}
```

**Option 2: Vercel (Recommended cho Frontend)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd syncwatch-frontend
vercel --prod
```

**vercel.json:**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "outputDirectory": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://syncwatch-backend.deno.dev/api/$1"
    },
    {
      "src": "/trpc/(.*)",
      "dest": "https://syncwatch-backend.deno.dev/trpc/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "PUBLIC_API_URL": "https://syncwatch-backend.deno.dev"
  }
}
```

**Option 3: AWS/GCP/Azure**

**AWS ECS Deployment:**
```yaml
# ecs-task-definition.json
{
  "family": "syncwatch",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "syncwatch-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/syncwatch-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://..."
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/syncwatch",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 5.8.3. Database Migration và Backup

**Migration Script:**
```typescript
// migrations/001_initial_schema.ts
export async function up(db: Database) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create all tables
  await db.execute(`CREATE TABLE rooms (...)`);
  await db.execute(`CREATE TABLE users (...)`);
  await db.execute(`CREATE TABLE queue (...)`);
  await db.execute(`CREATE TABLE messages (...)`);
  
  // Insert migration record
  await db.execute(`INSERT INTO schema_migrations (version) VALUES (1)`);
}

export async function down(db: Database) {
  await db.execute(`DROP TABLE IF EXISTS messages`);
  await db.execute(`DROP TABLE IF EXISTS queue`);
  await db.execute(`DROP TABLE IF EXISTS users`);
  await db.execute(`DROP TABLE IF EXISTS rooms`);
  await db.execute(`DELETE FROM schema_migrations WHERE version = 1`);
}
```

**Migration Runner:**
```typescript
// migrate.ts
import { Database } from 'sqlite';

class MigrationRunner {
  constructor(private db: Database) {}
  
  async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.query(`
        SELECT MAX(version) as version FROM schema_migrations
      `);
      return result[0]?.version || 0;
    } catch {
      return 0;
    }
  }
  
  async runMigrations() {
    const currentVersion = await this.getCurrentVersion();
    const migrations = await this.loadMigrations();
    
    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        console.log(`Running migration ${migration.version}...`);
        await migration.up(this.db);
        console.log(`Migration ${migration.version} completed`);
      }
    }
  }
  
  private async loadMigrations() {
    // Load migration files dynamically
    const migrationFiles = await Deno.readDir('./migrations');
    const migrations = [];
    
    for await (const file of migrationFiles) {
      if (file.name.endsWith('.ts')) {
        const module = await import(`./migrations/${file.name}`);
        const version = parseInt(file.name.split('_')[0]);
        migrations.push({ version, ...module });
      }
    }
    
    return migrations.sort((a, b) => a.version - b.version);
  }
}

// Run migrations
if (import.meta.main) {
  const db = new Database('./database.db');
  const runner = new MigrationRunner(db);
  await runner.runMigrations();
  db.close();
}
```

**Backup Script:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="syncwatch"

# Create backup directory
mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump $DATABASE_URL > $BACKUP_DIR/syncwatch_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/syncwatch_$DATE.sql

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/syncwatch_$DATE.sql.gz s3://syncwatch-backups/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "syncwatch_*.sql.gz" -mtime +30 -delete

echo "Backup completed: syncwatch_$DATE.sql.gz"
```

#### 5.8.4. Monitoring và Logging

**Logging Configuration:**
```typescript
// utils/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;
  
  constructor(level: string = 'info') {
    this.level = LogLevel[level.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO;
  }
  
  private log(level: LogLevel, message: string, meta?: any) {
    if (level < this.level) return;
    
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    
    const logEntry = {
      timestamp,
      level: levelName,
      message,
      ...meta
    };
    
    console.log(JSON.stringify(logEntry));
    
    // In production, send to logging service
    if (Deno.env.get('NODE_ENV') === 'production') {
      this.sendToLoggingService(logEntry);
    }
  }
  
  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta);
  }
  
  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta);
  }
  
  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta);
  }
  
  error(message: string, error?: Error, meta?: any) {
    this.log(LogLevel.ERROR, message, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    });
  }
  
  private async sendToLoggingService(logEntry: any) {
    // Send to external logging service (e.g., DataDog, LogRocket)
    try {
      await fetch('https://logs.datadoghq.com/v1/input/YOUR_API_KEY', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }
}

export const logger = new Logger(Deno.env.get('LOG_LEVEL'));
```

**Health Check Endpoint:**
```typescript
// routes/health.ts
import { Router } from 'oak';
import { DatabaseManager } from '../database/connection.ts';

const router = new Router();

router.get('/health', async (ctx) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Deno.uptime(),
    version: '1.0.0',
    checks: {
      database: 'unknown',
      memory: 'unknown',
      disk: 'unknown'
    }
  };
  
  try {
    // Database health check
    const db = DatabaseManager.getInstance();
    await db.query('SELECT 1');
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }
  
  // Memory usage check
  const memUsage = Deno.memoryUsage();
  const memUsageMB = memUsage.rss / 1024 / 1024;
  health.checks.memory = memUsageMB < 500 ? 'ok' : 'warning';
  
  // Set appropriate status code
  ctx.response.status = health.status === 'ok' ? 200 : 503;
  ctx.response.body = health;
});

export default router;
```

### 5.9. Troubleshooting Guide

#### 5.9.1. Common Development Issues

**Issue: Deno permission errors**
```bash
# Error: Requires net access to "0.0.0.0:8000"
# Solution: Add appropriate permissions
deno run --allow-net --allow-read --allow-write --allow-env server.ts
```

**Issue: CORS errors trong development**
```typescript
// Problem: Frontend không thể connect đến backend
// Solution: Ensure CORS is properly configured
app.use(oakCors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

**Issue: WebSocket connection failures**
```typescript
// Problem: WebSocket connections dropping
// Solution: Add connection heartbeat
setInterval(() => {
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, 30000);
```

**Issue: YouTube API quota exceeded**
```typescript
// Problem: Too many API requests
// Solution: Implement caching
const videoCache = new Map<string, VideoInfo>();

async function getVideoInfo(videoId: string) {
  if (videoCache.has(videoId)) {
    return videoCache.get(videoId);
  }
  
  const info = await fetchFromYouTubeAPI(videoId);
  videoCache.set(videoId, info);
  
  // Cache for 1 hour
  setTimeout(() => videoCache.delete(videoId), 3600000);
  
  return info;
}
```

#### 5.9.2. Production Issues

**Issue: High memory usage**
```typescript
// Monitor memory usage
setInterval(() => {
  const usage = Deno.memoryUsage();
  const usageMB = usage.rss / 1024 / 1024;
  
  if (usageMB > 500) {
    logger.warn('High memory usage detected', { usageMB });
    
    // Cleanup old connections
    cleanupInactiveConnections();
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  }
}, 60000);
```

**Issue: Database connection pool exhaustion**
```typescript
// Implement connection pooling
class DatabasePool {
  private pool: Database[] = [];
  private maxConnections = 10;
  
  async getConnection(): Promise<Database> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    
    if (this.activeConnections < this.maxConnections) {
      return new Database(DATABASE_URL);
    }
    
    // Wait for available connection
    return new Promise((resolve) => {
      this.waitingQueue.push(resolve);
    });
  }
  
  releaseConnection(db: Database) {
    if (this.waitingQueue.length > 0) {
      const resolve = this.waitingQueue.shift()!;
      resolve(db);
    } else {
      this.pool.push(db);
    }
  }
}
```

**Issue: WebSocket scaling problems**
```typescript
// Use Redis for multi-instance WebSocket scaling
import { Redis } from 'redis';

class ScalableWebSocketManager {
  private redis: Redis;
  private localConnections = new Map<string, WebSocket>();
  
  constructor() {
    this.redis = new Redis(REDIS_URL);
    this.redis.subscribe('room_events');
    
    this.redis.on('message', (channel, message) => {
      if (channel === 'room_events') {
        const event = JSON.parse(message);
        this.handleRemoteEvent(event);
      }
    });
  }
  
  broadcastToRoom(roomId: string, message: any) {
    // Broadcast locally
    this.broadcastLocally(roomId, message);
    
    // Broadcast to other instances via Redis
    this.redis.publish('room_events', JSON.stringify({
      roomId,
      message,
      instanceId: INSTANCE_ID
    }));
  }
  
  private handleRemoteEvent(event: any) {
    if (event.instanceId !== INSTANCE_ID) {
      this.broadcastLocally(event.roomId, event.message);
    }
  }
}
```

### 5.10. Maintenance và Updates

#### 5.10.1. Dependency Updates

**Automated dependency checking:**
```bash
# Check for outdated dependencies
deno info --json | jq '.modules[] | select(.specifier | contains("deno.land")) | .specifier'

# Update dependencies in deno.json
# Frontend dependencies
npm outdated
npm update
```

**Update script:**
```bash
#!/bin/bash
# update_deps.sh

echo "Updating Deno dependencies..."
deno cache --reload --lock=deno.lock deps.ts

echo "Updating Node.js dependencies..."
cd syncwatch-frontend
npm update
npm audit fix

echo "Running tests after updates..."
cd ../syncwatch-backend
deno test --allow-all

cd ../syncwatch-frontend
npm test

echo "Dependencies updated successfully!"
```

#### 5.10.2. Database Maintenance

**Regular maintenance tasks:**
```sql
-- Cleanup old messages (keep last 30 days)
DELETE FROM messages 
WHERE created_at < datetime('now', '-30 days');

-- Cleanup inactive rooms (no activity for 7 days)
DELETE FROM rooms 
WHERE last_updated < datetime('now', '-7 days')
AND id NOT IN (
  SELECT DISTINCT room_id FROM users WHERE room_id IS NOT NULL
);

-- Optimize database
VACUUM;
ANALYZE;

-- Update statistics
UPDATE sqlite_stat1 SET stat = NULL;
ANALYZE;
```

#### 5.10.3. Performance Monitoring

**Metrics collection:**
```typescript
// metrics.ts
export class MetricsCollector {
  private metrics = new Map<string, number>();
  
  increment(metric: string, value = 1) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }
  
  gauge(metric: string, value: number) {
    this.metrics.set(metric, value);
  }
  
  async collectSystemMetrics() {
    const memUsage = Deno.memoryUsage();
    this.gauge('memory.rss', memUsage.rss);
    this.gauge('memory.heap_used', memUsage.heapUsed);
    this.gauge('memory.heap_total', memUsage.heapTotal);
    
    // Collect custom metrics
    this.gauge('rooms.active', await this.getActiveRoomsCount());
    this.gauge('users.online', await this.getOnlineUsersCount());
    this.gauge('websockets.connections', this.getWebSocketConnectionsCount());
  }
  
  exportMetrics() {
    const output = [];
    for (const [name, value] of this.metrics) {
      output.push(`${name} ${value}`);
    }
    return output.join('\n');
  }
}

// Expose metrics endpoint
router.get('/metrics', (ctx) => {
  ctx.response.headers.set('Content-Type', 'text/plain');
  ctx.response.body = metricsCollector.exportMetrics();
});
```

### 5.11. Security Audit và Compliance

#### 5.11.1. Security Checklist

**Application Security:**
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (content sanitization)
- [ ] CSRF protection
- [ ] Rate limiting implemented
- [ ] Secure headers configured
- [ ] HTTPS enforced in production
- [ ] Sensitive data encrypted
- [ ] Error messages don't leak information
- [ ] Dependencies regularly updated

**Infrastructure Security:**
- [ ] Database access restricted
- [ ] API keys stored securely
- [ ] Network segmentation
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Access logging enabled
- [ ] Monitoring and alerting configured

#### 5.11.2. Privacy Compliance

**Data Protection:**
```typescript
// Privacy-compliant data handling
export class PrivacyManager {
  static anonymizeUser(user: User): AnonymizedUser {
    return {
      id: this.hashUserId(user.id),
      username: user.username, // Keep display name
      // Remove sensitive fields
    };
  }
  
  static async deleteUserData(userId: string) {
    const db = DatabaseManager.getInstance();
    
    // Delete user messages
    await db.execute('DELETE FROM messages WHERE user_id = ?', [userId]);
    
    // Remove user from rooms
    await db.execute('UPDATE users SET room_id = NULL WHERE id = ?', [userId]);
    
    // Delete user record
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    logger.info('User data deleted', { userId: this.hashUserId(userId) });
  }
  
  private static hashUserId(userId: string): string {
    // Use crypto API to hash user ID for logging
    const encoder = new TextEncoder();
    const data = encoder.encode(userId);
    return crypto.subtle.digest('SHA-256', data).then(hash => 
      Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 8)
    );
  }
}
```

### 5.12. Documentation và Knowledge Base

#### 5.12.1. API Documentation

Sử dụng OpenAPI/Swagger để document APIs:

```yaml
# api-docs.yaml
openapi: 3.0.0
info:
  title: SyncWatch API
  version: 1.0.0
  description: API for synchronized video watching application

servers:
  - url: https://api.syncwatch.app
    description: Production server
  - url: http://localhost:8000
    description: Development server

paths:
  /api/rooms:
    post:
      summary: Create a new room
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 100
                username:
                  type: string
                  minLength: 1
                  maxLength: 50
      responses:
        '201':
          description: Room created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RoomResponse'
        '400':
          description: Invalid request data

components:
  schemas:
    RoomResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            room_id:
              type: string
            user_id:
              type: string
            room:
              $ref: '#/components/schemas/Room'
```

#### 5.12.2. User Documentation

**User Guide Structure:**
1. **Getting Started**
   - Creating your first room
   - Joining a room
   - Basic navigation

2. **Features Guide**
   - Adding videos to queue
   - Chat functionality
   - Video controls
   - Room management

3. **Troubleshooting**
   - Common issues
   - Browser compatibility
   - Network requirements

4. **FAQ**
   - Account questions
   - Technical questions
   - Privacy and security

#### 5.12.3. Developer Documentation

**Contributing Guide:**
```markdown
# Contributing to SyncWatch

## Development Setup
1. Clone the repository
2. Install dependencies
3. Setup environment variables
4. Run development servers

## Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation

## Pull Request Process
1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Submit pull request
5. Address review feedback

## Release Process
1. Update version numbers
2. Update CHANGELOG.md
3. Create release tag
4. Deploy to production
```

Đây là kế hoạch phát triển chi tiết và toàn diện cho webapp SyncWatch. Kế hoạch này bao gồm tất cả các khía cạnh từ thiết kế kiến trúc, implementation, testing, deployment, đến maintenance và security. Với roadmap 12 tuần được chia thành 6 phases rõ ràng, team development có thể theo dõi tiến độ và đảm bảo chất lượng sản phẩm cuối cùng.


## 6. Tổng hợp và Executive Summary

### 6.1. Tóm tắt Dự án

**SyncWatch** là một webapp hiện đại cho phép nhiều người dùng xem video YouTube và nghe nhạc cùng nhau trong thời gian thực. Ứng dụng được thiết kế với kiến trúc microservices sử dụng Deno.js cho backend và Astro cho frontend, đảm bảo hiệu suất cao, khả năng mở rộng và trải nghiệm người dùng mượt mà.

**Tính năng chính:**
- **Đồng bộ hóa video real-time:** Tất cả người dùng trong cùng phòng xem video với trạng thái phát đồng bộ
- **Hệ thống chat tích hợp:** Giao tiếp trực tiếp với khả năng chia sẻ link YouTube
- **Queue management:** Hàng đợi video với drag-and-drop reordering
- **Room management:** Tạo và quản lý phòng với nhiều người dùng
- **Cross-platform compatibility:** Hoạt động trên desktop và mobile devices

**Công nghệ sử dụng:**
- **Backend:** Deno.js với Oak framework, WebSockets, SQLite/PostgreSQL
- **Frontend:** Astro với TypeScript, React components, Tailwind CSS
- **Deployment:** Docker containers, cloud-native architecture
- **Integration:** YouTube Data API v3

### 6.2. Business Value và ROI

#### 6.2.1. Target Market
- **Primary:** Nhóm bạn bè, gia đình muốn xem video cùng nhau từ xa
- **Secondary:** Cộng đồng online, gaming communities, educational groups
- **Tertiary:** Corporate teams cho team building activities

#### 6.2.2. Competitive Advantages
- **No Registration Required:** Người dùng có thể tham gia ngay lập tức
- **Modern Tech Stack:** Sử dụng công nghệ mới nhất đảm bảo performance
- **Real-time Synchronization:** Đồng bộ chính xác với latency thấp
- **Mobile-First Design:** Responsive design tối ưu cho mọi thiết bị
- **Open Source Potential:** Có thể mở source để thu hút developer community

#### 6.2.3. Revenue Streams (Future)
- **Freemium Model:** Basic features miễn phí, premium features trả phí
- **API Licensing:** Cung cấp API cho third-party integrations
- **White-label Solutions:** Customized solutions cho enterprises
- **Advertising:** Non-intrusive ads trong free tier

### 6.3. Technical Architecture Overview

#### 6.3.1. System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React.js)    │◄──►│   (Deno.js)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • UI Components │    │ • REST APIs     │    │ • YouTube API   │
│ • State Mgmt    │    │ • WebSockets    │    │ • Database      │
│ • Real-time     │    │ • Business      │    │ • Redis Cache   │
│   Updates       │    │   Logic         │    │ • CDN           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 6.3.2. Data Flow
1. **User Action:** Người dùng thực hiện hành động (play/pause/seek)
2. **Frontend Processing:** React component xử lý event và validate
3. **WebSocket Transmission:** Gửi event đến backend qua WebSocket
4. **Backend Processing:** Deno.js server xử lý business logic
5. **Database Update:** Cập nhật trạng thái trong database
6. **Broadcast:** Phát sóng event đến tất cả clients trong room
7. **Client Synchronization:** Các clients khác cập nhật UI accordingly

#### 6.3.3. Scalability Considerations
- **Horizontal Scaling:** Multiple backend instances với load balancer
- **Database Sharding:** Phân chia data theo room_id
- **CDN Integration:** Static assets delivery optimization
- **Caching Strategy:** Redis cho session data và frequently accessed content
- **WebSocket Scaling:** Redis pub/sub cho multi-instance communication

### 6.4. Development Timeline và Milestones

#### 6.4.1. Phase-by-Phase Breakdown

| Phase | Duration | Key Deliverables | Success Criteria |
|-------|----------|------------------|------------------|
| **Phase 1: Infrastructure** | 2 weeks | • Basic server setup<br>• Database schema<br>• API foundation | • Server running<br>• Database connected<br>• Basic endpoints working |
| **Phase 2: Room Management** | 2 weeks | • Room creation/joining<br>• User management<br>• WebSocket setup | • Users can create/join rooms<br>• Real-time presence working |
| **Phase 3: Video Integration** | 2 weeks | • YouTube player<br>• Video synchronization<br>• Basic controls | • Videos play synchronously<br>• Controls work across clients |
| **Phase 4: Queue System** | 2 weeks | • Queue management<br>• Drag & drop<br>• Auto-play next | • Queue operations working<br>• Smooth transitions |
| **Phase 5: Chat System** | 2 weeks | • Real-time chat<br>• Link detection<br>• Message history | • Chat working reliably<br>• YouTube links auto-add |
| **Phase 6: Polish & Deploy** | 2 weeks | • UI/UX refinement<br>• Performance optimization<br>• Production deployment | • Production-ready app<br>• Performance targets met |

#### 6.4.2. Critical Path Analysis
**Dependencies:**
- Phase 2 depends on Phase 1 (infrastructure must be ready)
- Phase 3 depends on Phase 2 (rooms needed for video sync)
- Phase 4 can partially overlap with Phase 3
- Phase 5 can partially overlap with Phase 4
- Phase 6 requires all previous phases complete

**Risk Mitigation:**
- **YouTube API Integration:** Start early integration testing
- **WebSocket Scaling:** Plan for Redis integration from Phase 2
- **Performance Testing:** Continuous testing throughout development
- **Browser Compatibility:** Regular testing on multiple browsers

### 6.5. Resource Requirements

#### 6.5.1. Development Team
**Minimum Team (3-4 people):**
- **1 Full-stack Developer:** Lead developer với experience trong Deno.js và React
- **1 Frontend Developer:** Chuyên về React.js, TypeScript, và UI/UX
- **1 Backend Developer:** Chuyên về Deno.js, WebSockets, và database design
- **1 DevOps Engineer (part-time):** Setup CI/CD, deployment, và monitoring

**Optimal Team (5-6 people):**
- **1 Tech Lead/Architect:** Overall technical direction và code review
- **2 Frontend Developers:** React development và UI/UX implementation
- **2 Backend Developers:** API development và WebSocket implementation
- **1 DevOps Engineer:** Infrastructure, deployment, và monitoring

#### 6.5.2. Infrastructure Costs (Monthly)

**Development Environment:**
- **Development Servers:** $50-100/month (cloud instances)
- **Database:** $20-50/month (managed database service)
- **Third-party Services:** $30-50/month (monitoring, logging)
- **Total Development:** ~$100-200/month

**Production Environment (Initial):**
- **Application Servers:** $200-500/month (2-3 instances)
- **Database:** $100-300/month (managed PostgreSQL)
- **CDN:** $50-100/month (static asset delivery)
- **Load Balancer:** $50-100/month
- **Monitoring & Logging:** $100-200/month
- **Total Production:** ~$500-1200/month

**Scaling Projections:**
- **1,000 concurrent users:** $800-1,500/month
- **10,000 concurrent users:** $2,000-4,000/month
- **100,000 concurrent users:** $8,000-15,000/month

#### 6.5.3. Software Licenses và Tools
**Free/Open Source:**
- Deno.js runtime (free)
- React.js framework (free)
- PostgreSQL database (free)
- Docker containers (free)
- Git version control (free)

**Paid Services:**
- **YouTube Data API:** Free tier (10,000 requests/day), paid tiers available
- **Cloud Hosting:** AWS/GCP/Azure (pay-as-you-go)
- **Monitoring Tools:** DataDog, New Relic ($100-500/month)
- **Error Tracking:** Sentry ($26-80/month)
- **CI/CD Platform:** GitHub Actions (free for public repos)

### 6.6. Risk Assessment và Mitigation

#### 6.6.1. Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **YouTube API Rate Limits** | Medium | High | • Implement caching<br>• Request quota increase<br>• Fallback mechanisms |
| **WebSocket Scaling Issues** | Medium | High | • Redis pub/sub implementation<br>• Load testing early<br>• Horizontal scaling plan |
| **Browser Compatibility** | Low | Medium | • Progressive enhancement<br>• Polyfills for older browsers<br>• Graceful degradation |
| **Database Performance** | Medium | Medium | • Query optimization<br>• Indexing strategy<br>• Connection pooling |
| **Security Vulnerabilities** | Low | High | • Regular security audits<br>• Input validation<br>• Dependency updates |

#### 6.6.2. Business Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **Market Competition** | High | Medium | • Unique features focus<br>• Rapid iteration<br>• Community building |
| **YouTube Policy Changes** | Medium | High | • Multiple video sources<br>• API alternatives<br>• Direct upload support |
| **User Adoption** | Medium | High | • MVP testing<br>• User feedback loops<br>• Marketing strategy |
| **Funding Constraints** | Low | High | • Phased development<br>• Revenue generation early<br>• Cost optimization |

#### 6.6.3. Operational Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **Team Availability** | Medium | Medium | • Cross-training<br>• Documentation<br>• Backup resources |
| **Infrastructure Outages** | Low | High | • Multi-region deployment<br>• Backup systems<br>• Incident response plan |
| **Data Loss** | Low | High | • Regular backups<br>• Replication<br>• Disaster recovery plan |

### 6.7. Success Metrics và KPIs

#### 6.7.1. Technical Metrics
- **Performance:**
  - Page load time < 2 seconds
  - Video sync latency < 500ms
  - WebSocket connection success rate > 99%
  - API response time < 200ms (95th percentile)

- **Reliability:**
  - System uptime > 99.9%
  - Error rate < 0.1%
  - Database query success rate > 99.9%

- **Scalability:**
  - Support 1,000 concurrent users initially
  - Horizontal scaling capability
  - Database performance under load

#### 6.7.2. User Experience Metrics
- **Engagement:**
  - Average session duration > 30 minutes
  - Return user rate > 40%
  - Room creation rate
  - Messages per session

- **Usability:**
  - Time to create room < 30 seconds
  - Time to join room < 15 seconds
  - User satisfaction score > 4.0/5.0
  - Support ticket volume < 5% of users

#### 6.7.3. Business Metrics
- **Growth:**
  - Monthly active users (MAU)
  - Daily active users (DAU)
  - User acquisition cost (CAC)
  - Viral coefficient (invites per user)

- **Retention:**
  - Day 1 retention > 60%
  - Day 7 retention > 30%
  - Day 30 retention > 15%
  - Churn rate < 10% monthly

### 6.8. Next Steps và Recommendations

#### 6.8.1. Immediate Actions (Week 1-2)
1. **Team Assembly:** Recruit và onboard development team
2. **Environment Setup:** Setup development environments và tools
3. **Project Kickoff:** Detailed planning session với team
4. **Prototype Development:** Basic proof-of-concept implementation
5. **Stakeholder Alignment:** Confirm requirements và expectations

#### 6.8.2. Short-term Goals (Month 1-3)
1. **MVP Development:** Complete core features implementation
2. **Alpha Testing:** Internal testing với limited user group
3. **Performance Optimization:** Initial performance tuning
4. **Security Audit:** Basic security assessment
5. **Beta Launch:** Limited public beta release

#### 6.8.3. Medium-term Goals (Month 4-6)
1. **Public Launch:** Full public release
2. **User Feedback Integration:** Implement user-requested features
3. **Scaling Preparation:** Infrastructure scaling for growth
4. **Mobile App Development:** Native mobile applications
5. **Partnership Exploration:** Integration partnerships

#### 6.8.4. Long-term Vision (Month 7-12)
1. **Advanced Features:** AI-powered recommendations, advanced room management
2. **Platform Expansion:** Support for additional video platforms
3. **Enterprise Solutions:** Business-focused features và pricing
4. **International Expansion:** Multi-language support
5. **Community Building:** Developer ecosystem và third-party integrations

### 6.9. Conclusion

Dự án SyncWatch đại diện cho một cơ hội tuyệt vời để tạo ra một platform innovative cho synchronized video watching experience. Với kiến trúc technical solid, development plan chi tiết, và risk mitigation strategies comprehensive, dự án có potential cao để thành công trong thị trường competitive.

**Key Success Factors:**
- **Technical Excellence:** Sử dụng modern tech stack và best practices
- **User-Centric Design:** Focus vào user experience và ease of use
- **Scalable Architecture:** Thiết kế để handle growth từ đầu
- **Agile Development:** Iterative development với continuous feedback
- **Community Focus:** Building community around the platform

**Investment Justification:**
- **Market Opportunity:** Growing demand cho remote social experiences
- **Technical Feasibility:** Proven technologies và clear implementation path
- **Competitive Advantage:** Unique features và superior user experience
- **Scalability Potential:** Architecture designed cho massive scale
- **Revenue Opportunities:** Multiple monetization strategies available

Với timeline 12 tuần và budget estimate reasonable, SyncWatch có thể được developed và launched successfully, tạo foundation cho long-term growth và success trong social video watching market.

---

**Document Information:**
- **Version:** 1.0
- **Last Updated:** December 2024
- **Author:** Manus AI
- **Status:** Final Draft
- **Next Review:** Q1 2025

**Appendices:**
- A. Technical Specifications Detail
- B. API Documentation Complete
- C. Database Schema Scripts
- D. Deployment Runbooks
- E. Testing Procedures
- F. Security Audit Checklist

