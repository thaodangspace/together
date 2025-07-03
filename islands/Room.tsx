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
  const [videoId, setVideoId] = useState("");
  const userId = typeof window !== "undefined"
    ? localStorage.getItem("userId")
    : "";

  const fetchState = async () => {
    try {
      const resp = await fetch("/current-state");
      const data = await resp.json();
      setState(data.state);
      setQueue(data.queue || []);
    } catch (_e) {
      // ignore network errors
    }
  };

  useEffect(() => {
    let running = true;
    const poll = async () => {
      while (running) {
        await fetchState();
        await new Promise((r) => setTimeout(r, 3000));
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
    <div class="space-y-4">
      <form onSubmit={submit} class="flex gap-2">
        <input
          class="border-2 px-2 py-1 flex-grow"
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
        <h2 class="font-bold">Queue</h2>
        <ul>
          {queue.map((item) => (
            <li key={item.videoId}>{item.title || item.videoId}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
