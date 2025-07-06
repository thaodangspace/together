import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";

export default function JoinForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const join = async (e: Event) => {
    e.preventDefault();
    if (!name) return;
    try {
      const resp = await fetch("/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await resp.json();
      if (resp.ok) {
        localStorage.setItem("userId", data.id);
        location.href = "/room";
      } else {
        setError(data.error || "Failed to join");
      }
    } catch (_err) {
      setError("Failed to join");
    }
  };

  return (
    <form onSubmit={join} class="flex gap-2 w-full">
      <input
        class="flex-grow border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        type="text"
        placeholder="Your name"
        value={name}
        onInput={(e) => setName((e.target as HTMLInputElement).value)}
      />
      <Button type="submit">Join</Button>
      {error && <p class="text-red-600 text-sm ml-2 self-center">{error}</p>}
    </form>
  );
}
