@echo off
title Stop Quench Server
echo Stopping all running Quench python backend servers...
taskkill /F /IM python.exe /T >nul 2>&1
echo Done!
timeout /t 2 /nobreak >nul
