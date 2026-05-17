@echo off
chcp 65001 >nul
echo ===================================================
echo   당근마켓 클론 프로젝트 자동 실행 스크립트
echo ===================================================

echo.
echo [1/3] 백엔드 설정 및 패키지 설치 중...
cd backend
if not exist venv (
    echo 가상환경(venv) 생성 중...
    python -m venv venv
)
echo 백엔드 라이브러리 설치 중...
call venv\Scripts\pip install -r requirements.txt -q
cd ..

echo.
echo [2/3] 프론트엔드 설정 및 패키지 설치 중...
cd frontend
if not exist node_modules (
    echo 프론트엔드 라이브러리 설치 중...
    call npm install
)
cd ..

echo.
echo [3/3] 서버 실행 및 웹 브라우저 열기...
echo 백엔드 서버(FastAPI) 실행 중...
start "Daangn Backend" cmd /k "cd backend && venv\Scripts\uvicorn main:app --reload --port 8000"

echo 프론트엔드 서버(Vite) 실행 중...
start "Daangn Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo 잠시 후 웹 브라우저에서 서비스가 열립니다...
timeout /t 5 >nul
start http://localhost:5173

echo ===================================================
echo   모든 서비스가 실행되었습니다. 즐거운 개발 되세요!
echo ===================================================
pause
