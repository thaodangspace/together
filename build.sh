#!/bin/sh

if [ "$1" = "check" ]; then
    echo "🔍 Running cargo check..."
    cargo check
    exit $?
fi

echo "🔧 Installing dependencies..."
cargo install trunk
rustup target add wasm32-unknown-unknown

# Install Tailwind CSS standalone binary
echo "📦 Installing Tailwind CSS standalone binary..."
OS=$(uname | tr '[:upper:]' '[:lower:]')
case "$OS" in
    linux*)
        curl -sLO https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64
        chmod +x tailwindcss-linux-x64
        mv tailwindcss-linux-x64 ./tailwindcss
        ;;
    darwin*)
        curl -sLO https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-macos-x64
        chmod +x tailwindcss-macos-x64
        mv tailwindcss-macos-x64 ./tailwindcss
        ;;
    *)
        curl -sLO https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-windows-x64.exe
        mv tailwindcss-windows-x64.exe ./tailwindcss.exe
        ;;
esac

echo "🎨 Building CSS with Tailwind CSS standalone binary..."
# Create target/site directory if it doesn't exist
mkdir -p ./target/site

# Build CSS with standalone binary
case "$OS" in
    mingw*|msys*|cygwin*|windows*)
        ./tailwindcss.exe -i ./style/tailwind.css -o ./target/site/tailwind.css --minify
        ;;
    *)
        ./tailwindcss -i ./style/tailwind.css -o ./target/site/tailwind.css --minify
        ;;
esac

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

echo ""
echo "📋 Next steps:"
echo "1. Copy environment file: cp env.example .env"
echo "2. Edit .env with your YouTube API key"
echo "3. Run the server: ./target/release/server" 
