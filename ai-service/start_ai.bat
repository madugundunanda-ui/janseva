@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo [AI-SERVICE] Creating virtual environment...
  py -3 -m venv .venv
  if errorlevel 1 (
    echo [AI-SERVICE] Failed to create venv using 'py -3'. Ensure Python is installed.
    exit /b 1
  )
)

call ".venv\Scripts\activate.bat"
if errorlevel 1 (
  echo [AI-SERVICE] Failed to activate virtual environment.
  exit /b 1
)

echo [AI-SERVICE] Installing/refreshing dependencies...
python -m pip install --upgrade pip
if errorlevel 1 exit /b 1
python -m pip install -r requirements.txt
if errorlevel 1 exit /b 1

echo [AI-SERVICE] Starting Flask AI service on port 8000...
python app.py

endlocal
