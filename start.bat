@echo off
REM Upwork Assistant Startup Script for Windows

echo 🚀 Starting Upwork Assistant...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Start backend server in background
echo 🐍 Starting Python backend server...
start /B python main.py

REM Give backend time to start
timeout /t 3 >nul

REM Change to UI directory and install dependencies
cd ui
echo 📦 Installing Node.js dependencies...
call npm install

REM Start frontend development server
echo ⚛️ Starting Next.js frontend...
start /B npm run dev

echo ✅ Upwork Assistant is running!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo.
echo Press any key to stop all services
pause >nul

REM Kill background processes (basic cleanup)
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
