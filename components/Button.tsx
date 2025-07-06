import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled}
      class={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors ${
        props.class ?? ""
      }`}
    />
  );
}
