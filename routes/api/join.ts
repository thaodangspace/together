import { Handlers } from "$fresh/mod.ts";
import { eventTarget, state, User } from "../../state.ts";

export const handler: Handlers = {
  async POST(req) {
    const { username } = await req.json();
    const user: User = {
      id: crypto.randomUUID(),
      username,
    };
    state.users.push(user);
    eventTarget.dispatchEvent(new Event("user"));
    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
