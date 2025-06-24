#!/bin/bash

echo "🔧 YouTube Together - Setup Script"
echo "=================================="

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 Detected Linux - Installing system dependencies..."
    
    # Check for package manager
    if command -v apt &> /dev/null; then
        echo "Using apt (Ubuntu/Debian)..."
        sudo apt update
        sudo apt install -y build-essential libssl-dev pkg-config curl
    elif command -v dnf &> /dev/null; then
        echo "Using dnf (Fedora/RHEL)..."
        sudo dnf install -y openssl-devel pkg-config gcc curl
    elif command -v yum &> /dev/null; then
        echo "Using yum (CentOS/RHEL)..."
        sudo yum install -y openssl-devel pkgconfig gcc curl
    elif command -v pacman &> /dev/null; then
        echo "Using pacman (Arch Linux)..."
        sudo pacman -S --noconfirm openssl pkg-config gcc curl
    else
        echo "⚠️  Could not detect package manager. Please install manually:"
        echo "   - OpenSSL development headers"
        echo "   - pkg-config"
        echo "   - gcc/build tools"
        exit 1
    fi
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📦 Detected macOS - Checking dependencies..."
    
    if ! command -v brew &> /dev/null; then
        echo "⚠️  Homebrew not found. Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    echo "Installing OpenSSL and pkg-config via Homebrew..."
    brew install openssl pkg-config
    
else
    echo "⚠️  Unsupported OS: $OSTYPE"
    echo "Please install manually:"
    echo "   - OpenSSL development headers"
    echo "   - pkg-config"
    echo "   - Build tools (gcc/clang)"
    exit 1
fi

echo ""
echo "✅ System dependencies installed!"
echo ""
echo "📋 Next steps:"
echo "1. Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
echo "2. Install Node.js: https://nodejs.org/en/download/"
echo "3. Run: npm install"
echo "4. Run: chmod +x build.sh && ./build.sh"
echo ""
echo "🚀 Happy coding!" 