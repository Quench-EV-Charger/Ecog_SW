@echo off
cd /d "%~dp0"
title Quench Commissioning Tool (Server)

echo =======================================================
echo          QUENCH COMMISSIONING TOOL INITIALIZING        
echo =======================================================
echo.
echo Starting local Python backend...

:: Open the beautiful splash screen immediately so the user isn't kept waiting
echo Opening startup loading screen...
start splash.html

cd backend

:: Start the FastAPI server in the background
start "Quench Server" cmd /c "python -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo.
echo -------------------------------------------------------
echo The Quench Production Testing Tool is now starting!
echo Please keep the background "Quench Server" window open.
echo -------------------------------------------------------
pause
