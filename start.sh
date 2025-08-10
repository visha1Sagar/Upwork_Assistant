#!/bin/bash

# Upwork Assistant Startup Script

echo "🚀 Starting Upwork Assistant..."

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Start backend server in background
echo "🐍 Starting Python backend server..."
python main.py &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Change to UI directory and install dependencies
cd ui
echo "📦 Installing Node.js dependencies..."
npm install

# Start frontend development server
echo "⚛️  Starting Next.js frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Upwork Assistant is running!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
