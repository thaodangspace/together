// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $api_joke from "./routes/api/joke.ts";
import * as $api_validate_user from "./routes/api/validate-user.ts";
import * as $current_state from "./routes/current-state.ts";
import * as $join from "./routes/join.ts";
import * as $request_video from "./routes/request-video.ts";
import * as $update_mode from "./routes/update-mode.ts";
import * as $room from "./routes/room.tsx";
import * as $greet_name_ from "./routes/greet/[name].tsx";
import * as $index from "./routes/index.tsx";
import * as $Counter from "./islands/Counter.tsx";
import * as $JoinForm from "./islands/JoinForm.tsx";
import * as $Room from "./islands/Room.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/api/joke.ts": $api_joke,
    "./routes/api/validate-user.ts": $api_validate_user,
    "./routes/current-state.ts": $current_state,
    "./routes/join.ts": $join,
    "./routes/request-video.ts": $request_video,
    "./routes/update-mode.ts": $update_mode,
    "./routes/room.tsx": $room,
    "./routes/greet/[name].tsx": $greet_name_,
    "./routes/index.tsx": $index,
  },
  islands: {
    "./islands/Counter.tsx": $Counter,
    "./islands/JoinForm.tsx": $JoinForm,
    "./islands/Room.tsx": $Room,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
