@echo off
cd /d "%~dp0"
echo ========================================================
echo  AI vs ASLI -- ZENITH SCHOOL OF AI
echo  Starting local web server...
echo ========================================================
echo.
echo  Open in your browser: http://127.0.0.1:5000
echo  Press Ctrl+C in this window anytime to stop.
echo.
call .venv\Scripts\python.exe app.py
pause
