# Single Port Setup - Technical Overview

This document explains how SyncWatch runs both frontend and backend on a single port (8000).

## 🏗️ Architecture Overview

```
Port 8000
├── /api/*          → Backend API Routes (Deno.js)
├── /health         → Backend Health Check
├── /trpc/*         → tRPC Endpoints (Future)
├── /dist/*         → Static Frontend Files (Astro build)
└── /*              → SPA Routing (index.html)
```

## 🔧 How It Works

### 1. Development Mode (2 Ports)

-   **Frontend**: Astro dev server on port 3000
-   **Backend**: Deno.js server on port 8000
-   **Proxy**: Vite proxy forwards `/api/*` calls to port 8000

### 2. Production Mode (1 Port)

-   **Frontend**: Built to static files in `./dist/`
-   **Backend**: Serves API + static files on port 8000
-   **Routing**: Oak middleware handles both API and static serving

## 📂 Static File Serving Logic

```typescript
// In server/server.ts
app.use(async (ctx, next) => {
    // Skip static serving for API routes
    if (
        ctx.request.url.pathname.startsWith('/api') ||
        ctx.request.url.pathname.startsWith('/trpc')
    ) {
        await next();
        return;
    }

    try {
        // Serve static files from ./dist/
        await send(ctx, ctx.request.url.pathname, {
            root: `${Deno.cwd()}/dist`,
            index: 'index.html',
        });
    } catch {
        // Fallback to index.html for SPA routing
        await send(ctx, '/index.html', {
            root: `${Deno.cwd()}/dist`,
        });
    }
});
```

## 🚀 Build Process

1. **Astro Build**: `deno task build`

    - Compiles React components
    - Generates static HTML/CSS/JS
    - Outputs to `./dist/` directory

2. **Server Start**: `deno task server:start`
    - Starts Deno.js server
    - Serves API endpoints
    - Serves static files from `./dist/`

## 📋 Commands

### Quick Start

```bash
./build.sh                           # Build + Start
```

### Manual

```bash
deno task build                      # Build frontend
deno task server:start               # Start server
```

### Development

```bash
deno task dev                        # Frontend dev server (port 3000)
deno task server:dev                 # Backend dev server (port 8000)
```

## 🔄 File Structure After Build

```
together/
├── dist/                           # Built frontend (generated)
│   ├── index.html                  # Main HTML file
│   ├── _astro/                     # Built assets
│   └── ...                         # Other static files
├── server/                         # Backend source
│   ├── server.ts                   # Main server (serves dist/ + API)
│   └── ...
├── src/                           # Frontend source
│   └── ...
└── build.sh                      # Build script
```

## 🌐 URL Routing

When you visit `http://localhost:8000`:

| URL Path      | Handled By   | Purpose                 |
| ------------- | ------------ | ----------------------- |
| `/`           | Static Files | Main app page           |
| `/room/123`   | Static Files | Room page (SPA routing) |
| `/api/rooms`  | Backend API  | Room management         |
| `/api/health` | Backend API  | Health check            |
| `/assets/*`   | Static Files | CSS, JS, images         |

## ✅ Benefits

1. **Simplified Deployment**: One server, one port
2. **No CORS Issues**: Same origin for API and frontend
3. **Production Ready**: Mimics typical production setups
4. **Easy Scaling**: Can be containerized as single unit

## 🔧 Customization

### Change Port

Edit `server/env.example` or `.env`:

```bash
PORT=3000  # Changes both API and frontend port
```

### Change Build Directory

Edit `astro.config.mjs`:

```javascript
export default defineConfig({
    outDir: './public', // Change from ./dist
    // ...
});
```

Then update `server/server.ts` static serving path accordingly.

## 🐛 Troubleshooting

### "No dist directory" Error

```bash
# Make sure to build first
deno task build
```

### API Routes Not Working

-   Check if routes start with `/api/`
-   Verify backend server is running
-   Check browser network tab for 404s

### Static Files Not Loading

-   Ensure `./dist/` directory exists
-   Check file permissions
-   Verify Astro build completed successfully

## 📝 Notes

-   Development mode keeps separate ports for hot reload
-   Production mode combines both for simplicity
-   tRPC routes (future) will use `/trpc/*` prefix
-   Static files take precedence over dynamic routes
