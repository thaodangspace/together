#!/bin/bash

echo "🏗️ Building SyncWatch Frontend..."
deno task build

echo "✅ Frontend built successfully!"
echo "📂 Static files ready in ./dist/"
echo ""
echo "🚀 Starting SyncWatch Server (Frontend + Backend on port 8000)..."
echo "📡 Access the app at: http://localhost:8000"
echo ""

deno task server:start 