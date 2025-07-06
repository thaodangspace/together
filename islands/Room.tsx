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

export default function Room() {
  const [state, setState] = useState<RoomState | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [counter, setCounter] = useState(0);
  const [videoId, setVideoId] = useState("");
  const userId = typeof window !== "undefined"
    ? localStorage.getItem("userId")
    : "";

  const fetchState = async () => {
    try {
      const resp = await fetch(`/current-state?since=${counter}`);
      const data = await resp.json();
      setState(data.state);
      setQueue(data.queue || []);
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

  return (
    <div class="space-y-6">
      <form onSubmit={submit} class="flex gap-2">
        <input
          class="flex-grow border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={videoId}
          onInput={(e) => setVideoId((e.target as HTMLInputElement).value)}
          placeholder="YouTube video ID"
        />
        <Button type="submit">Request</Button>
      </form>

      {state?.currentVideoId && (
        <div class="mt-4">
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${state.currentVideoId}?autoplay=1`}
            allow="autoplay"
          />
        </div>
      )}

      <div>
        <h2 class="font-bold mb-2">Queue</h2>
        <ul class="space-y-1">
          {queue.map((item) => (
            <li
              key={item.videoId}
              class="p-2 bg-gray-100 rounded"
            >
              {item.title || item.videoId}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
