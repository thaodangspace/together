import JoinForm from "../islands/JoinForm.tsx";
import { Handlers } from "$fresh/server.ts";
import { getKv } from "../lib/kv.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (ip) {
      const kv = await getKv();
      for await (
        const entry of kv.list<{ ip?: string }>({ prefix: ["users"] })
      ) {
        if (entry.value.ip === ip) {
          return new Response(null, {
            status: 307,
            headers: { location: "/room" },
          });
        }
      }
    }
    return ctx.render();
  },
};

export default function Home() {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
      <div class="w-full max-w-md p-8 bg-white text-gray-900 rounded-xl shadow-lg">
        <img
          class="mx-auto mb-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="logo"
        />
        <h1 class="text-3xl font-bold text-center mb-4">Join the Radio Room</h1>
        <JoinForm />
      </div>
    </div>
  );
}
