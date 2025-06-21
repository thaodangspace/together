# SyncWatch - Deno + Astro Template Implementation

This project has been restructured to follow the official [Deno-Astro template](https://github.com/denoland/deno-astro-template) structure, providing a modern, unified development experience.

## 🚀 Quick Start

### Prerequisites

-   **Deno** 1.36+ - [Install Deno](https://deno.land/manual/getting_started/installation)

### Development

```bash
# Install dependencies
deno install

# Start development server
deno task dev

# Or use npm scripts (they use Deno under the hood)
npm run dev
```

The application will be available at `http://localhost:3001`

### Production

```bash
# Build for production
deno task build

# Preview production build
deno task preview
```

## 🏗️ Project Structure

Following the Deno-Astro template structure:

```
together/
├── src/                    # Astro source files
│   ├── components/         # Astro/React components
│   ├── layouts/           # Layout components
│   ├── pages/             # File-based routing
│   │   ├── index.astro    # Home page
│   │   ├── demo.astro     # Demo page showcasing features
│   │   └── api/           # API routes
│   │       └── resources.json.ts  # REST API endpoints
│   ├── services/          # Frontend services
│   ├── store/            # State management
│   ├── styles/           # Global styles
│   └── utils/            # Utility functions
├── public/               # Static assets
├── server/              # Backend services (your original server)
├── package.json         # npm dependencies & scripts
├── deno.json           # Deno configuration
├── astro.config.mjs    # Astro with Deno adapter
├── tailwind.config.mjs # Tailwind CSS config
└── tsconfig.json       # TypeScript configuration
```

## 🔧 Key Features

### ✅ Unified Runtime

-   **Single Runtime**: Everything runs on Deno
-   **No Node.js Required**: Pure Deno environment
-   **Modern APIs**: Web standards and Deno APIs

### ✅ Server-Side Rendering (SSR)

-   **@astrojs/deno adapter**: Configured for Deno runtime
-   **API Routes**: Server-side API endpoints in `/src/pages/api`
-   **Build-time Fetching**: Data fetched during SSR

### ✅ TypeScript Support

-   **Full TypeScript**: End-to-end TypeScript support
-   **Astro Types**: Built-in Astro type definitions
-   **Type Safety**: Validated configurations

### ✅ Modern Tooling

-   **Tailwind CSS**: Integrated utility-first CSS
-   **React Integration**: Use React components in Astro
-   **Hot Reloading**: Fast development experience

## 📡 API Routes

The template includes REST API routes following Astro conventions:

### GET `/api/resources.json`

```bash
curl http://localhost:3001/api/resources.json
```

### POST `/api/resources.json`

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"A test resource"}' \
  http://localhost:3001/api/resources.json
```

### DELETE `/api/resources.json?id=<id>`

```bash
curl -X DELETE http://localhost:3001/api/resources.json?id=<resource-id>
```

## 🖥️ Demo Page

Visit `/demo` to see all features in action:

-   Server-side rendering demonstration
-   API interaction examples
-   Client-side form handling
-   Real-time updates

## 🔄 Migration from Split Architecture

### Before (Your Original Structure)

```
together/
├── server/     # Deno backend
└── www/        # Astro frontend
```

### After (Deno-Astro Template)

```
together/
├── src/        # Unified Astro app with API routes
├── server/     # Your existing backend (kept for compatibility)
└── ...         # Template structure
```

### Key Changes Made

1. **Root-level Configuration**:

    - `package.json` with Deno-compatible scripts
    - `deno.json` with Astro imports
    - `astro.config.mjs` with Deno adapter

2. **Unified Source Structure**:

    - Moved `www/src/` → `src/`
    - Added API routes in `src/pages/api/`
    - Kept `server/` for your existing backend

3. **Dependency Management**:
    - npm packages via Deno's npm compatibility
    - Deno modules via import maps
    - Mixed ecosystem support

## 🚀 Deployment

### Deno Deploy (Recommended)

1. **GitHub Actions Deployment**:

    ```yaml
    - name: Upload to Deno Deploy
      uses: denoland/deployctl@v1
      with:
          project: syncwatch
          entrypoint: server/entry.mjs
          root: dist
    ```

2. **Direct Deployment**:
    ```bash
    deno task build
    deployctl deploy --project=syncwatch --no-static --include=./dist ./dist/server/entry.mjs
    ```

### Traditional Hosting

The built output in `dist/` can be deployed to any platform supporting Node.js or Deno.

## 🛠️ Development Commands

### Deno Tasks (Recommended)

```bash
deno task dev      # Start development server
deno task build    # Build for production
deno task preview  # Preview production build
deno task server:dev  # Run your original backend
```

### npm Scripts (Compatibility)

```bash
npm run dev        # Same as deno task dev
npm run build      # Same as deno task build
npm start          # Same as deno task start
```

## 🔗 Integration with Your Backend

Your existing `server/` directory is preserved and can run alongside:

```bash
# Terminal 1: Astro frontend
deno task dev

# Terminal 2: Your backend services
deno task server:dev
```

## 🎯 Next Steps

1. **Integrate Backend**: Connect your `server/` services with Astro API routes
2. **Add Features**: Implement your SyncWatch features using the template structure
3. **Deploy**: Use Deno Deploy for serverless deployment
4. **Scale**: Add database integration (SQLite/PostgreSQL)

## 📚 Resources

-   [Deno-Astro Template](https://github.com/denoland/deno-astro-template)
-   [Astro Documentation](https://docs.astro.build/)
-   [Deno Documentation](https://deno.land/manual)
-   [@astrojs/deno Adapter](https://docs.astro.build/en/guides/integrations-guide/deno/)

---

✅ **Status**: Successfully migrated to Deno-Astro template structure
🎯 **Ready for**: Phase 2 implementation with unified architecture
