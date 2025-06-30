import { useState } from "preact/hooks";

export default function JoinModal() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

  async function join() {
    await fetch("/api/join", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
    setJoined(true);
  }

  if (joined) return null;

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div class="bg-gray-800 p-4 rounded">
        <input
          class="border p-2 mr-2"
          value={username}
          onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
        />
        <button class="bg-red-600 text-white px-3 py-2" onClick={join}>
          Join
        </button>
      </div>
    </div>
  );
}
