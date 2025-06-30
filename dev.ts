#!/usr/bin/env -S deno run -A --watch=static/,routes/
import { Builder } from "$fresh/dev.ts";
import { app } from "./main.ts";

const builder = new Builder({ target: "es2022" });

if (Deno.args.includes("build")) {
  await builder.build(app);
} else {
  await builder.listen(app);
}
