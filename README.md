# \U0001F3B5 YouTube Together (Fresh)

A real-time collaborative YouTube viewing application built with
[Fresh](https://fresh.deno.dev). This repository replaces the previous Rust
codebase with a minimal Fresh setup.

## \u2728 Features

- **Single Shared Room**: All users join one unified shared room
- **Real-time Video Synchronization**
- **Queue Management**
- **Live Chat**
- **User Management**

These features are currently provided as placeholders. State is kept in memory
and events are dispatched through a simple `EventTarget`.

## \ud83d\udcaa Development

1. Install [Deno](https://deno.com/manual/getting_started/installation)
2. Run the dev server:

```bash
deno task start
```

The project will start on `http://localhost:8000`.
