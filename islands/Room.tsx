import { useEffect, useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";

interface QueueItem {
  videoId: string;
  title?: string;
  thumbnail?: string;
}

interface RoomState {
  currentVideoId: string | null;
  mode: "video" | "radio";
  playbackTime: number;
}

interface ChatMessage {
  userId: string;
  userName?: string;
  text: string;
  ts?: number;
}

export default function Room() {
  const [state, setState] = useState<RoomState | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [counter, setCounter] = useState(0);
  const [videoId, setVideoId] = useState("");
  const [chatText, setChatText] = useState("");
  const userId = typeof window !== "undefined"
    ? localStorage.getItem("userId")
    : "";

  const fetchState = async () => {
    try {
      const resp = await fetch(`/current-state?since=${counter}`);
      const data = await resp.json();
      setState(data.state);
      setQueue(data.queue || []);
      setMessages(data.messages || []);
      setCounter(data.counter || 0);
    } catch (_e) {
      // ignore network errors
    }
  };

  useEffect(() => {
    let running = true;
    const poll = async () => {
      while (running) {
        await fetchState();
        await new Promise((r) => setTimeout(r, 1000));
      }
    };
    poll();
    return () => {
      running = false;
    };
  }, []);

  const submit = async (e: Event) => {
    e.preventDefault();
    if (!videoId) return;
    try {
      await fetch("/request-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, userId }),
      });
      setVideoId("");
      fetchState();
    } catch (_e) {
      // ignore network errors
    }
  };

  const sendChat = async (e: Event) => {
    e.preventDefault();
    if (!chatText) return;
    try {
      await fetch("/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chatText, userId }),
      });
      setChatText("");
      fetchState();
    } catch (_e) {
      // ignore network errors
    }
  };

  return (
    <div class="flex gap-4 h-screen p-4 box-border">
      <div class="flex flex-col flex-1">
        <form onSubmit={submit} class="flex gap-2 mb-4">
          <input
            class="flex-grow border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={videoId}
            onInput={(e) => setVideoId((e.target as HTMLInputElement).value)}
            placeholder="YouTube video ID"
          />
          <Button type="submit">Request</Button>
        </form>
        <div class="flex-1 flex items-center justify-center">
          {state?.currentVideoId && (
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${state.currentVideoId}?autoplay=1`}
              allow="autoplay"
            />
          )}
        </div>
        <div class="mt-4">
          <h2 class="font-bold mb-2">Queue</h2>
          <ul class="space-y-1">
            {queue.map((item) => (
              <li key={item.videoId} class="p-2 bg-gray-100 rounded">
                {item.title || item.videoId}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div class="w-64 border-l pl-4 flex flex-col">
        <h2 class="font-bold mb-2">Chat</h2>
        <div class="flex-1 overflow-y-auto mb-2 space-y-1">
          {messages.map((m) => (
            <div key={m.ts} class="p-2 bg-gray-100 rounded">
              <span class="font-bold mr-2">{m.userName || m.userId}:</span>
              {m.text}
            </div>
          ))}
        </div>
        <form onSubmit={sendChat} class="flex gap-2">
          <input
            class="flex-grow border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={chatText}
            onInput={(e) => setChatText((e.target as HTMLInputElement).value)}
            placeholder="Message"
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}
