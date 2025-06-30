import { AppProps } from "$fresh/server.ts";

export default function App({ Component }: AppProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/static/style.css" />
        <title>YouTube Together</title>
      </head>
      <body class="min-h-screen">
        <Component />
      </body>
    </html>
  );
}
