@echo off
echo ===================================================
echo   Buleum Project Start Script
echo ===================================================

echo.
echo [1/3] Backend Setup...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\pip install -r requirements.txt
cd ..

echo.
echo [2/3] Frontend Setup...
cd frontend
if not exist node_modules (
    call npm install
)
cd ..

echo.
echo [3/3] Starting Servers...
start "Buleum Backend" cmd /k "cd backend && venv\Scripts\uvicorn main:app --reload --port 8000"
start "Buleum Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Opening browser in 5 seconds...
timeout /t 5 >nul
start http://localhost:5173

echo ===================================================
echo   All services started!
echo ===================================================
pause
