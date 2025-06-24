#!/bin/bash

echo "🔧 Installing dependencies..."
cargo install trunk
rustup target add wasm32-unknown-unknown

# Install Tailwind CSS via npm (requires Node.js)
echo "📦 Installing Tailwind CSS..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    curl -sLO https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64
    chmod +x tailwindcss-linux-x64
    mv tailwindcss-linux-x64 tailwindcss
elif [[ "$OSTYPE" == "darwin"* ]]; then
    curl -sLO https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-macos-x64
    chmod +x tailwindcss-macos-x64
    mv tailwindcss-macos-x64 tailwindcss
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    curl -sLO https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-windows-x64.exe
    mv tailwindcss-windows-x64.exe tailwindcss.exe
fi

echo "🎨 Building frontend with Tailwind CSS..."
# Use npx if available, otherwise use local binary
if command -v npx &> /dev/null; then
    npx tailwindcss -i ./style/tailwind.css -o ./target/site/tailwind.css --minify &
else
    ./tailwindcss -i ./style/tailwind.css -o ./target/site/tailwind.css --minify &
fi
TAILWIND_PID=$!

echo "🦀 Building frontend with Trunk..."
trunk build --release

echo "🔨 Building backend..."
cargo build --release --bin server --features ssr

echo "🎉 Build complete!"
echo "📁 Frontend assets: ./target/site/"
echo "🚀 Server binary: ./target/release/server"
echo ""
echo "To run the server:"
echo "  cp .env.example .env  # Edit with your settings"
echo "  ./target/release/server"

# Stop Tailwind watch process
kill $TAILWIND_PID 2>/dev/null

echo ""
echo "📋 Next steps:"
echo "1. Copy environment file: cp env.example .env"
echo "2. Edit .env with your YouTube API key"
echo "3. Run the server: ./target/release/server" 