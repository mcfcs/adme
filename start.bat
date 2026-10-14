@echo off

cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python 3.11+ from https://www.python.org and try again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node 20+ from https://nodejs.org and try again.
  pause
  exit /b 1
)

if not exist "backend\.venv\Scripts\python.exe" (
  echo Creating the Python environment...
  python -m venv backend\.venv
  if errorlevel 1 goto failed
  echo Installing backend packages...
  backend\.venv\Scripts\python -m pip install -r requirements.txt
  if errorlevel 1 goto failed
)

if not exist "backend\.env" (
  echo No backend\.env found, copying backend\.env.example.
  echo With DATABASE_URL empty, ADME uses a local SQLite database.
  copy "backend\.env.example" "backend\.env" >nul
)

if not exist "frontend\node_modules" (
  echo Installing frontend packages...
  pushd frontend
  call npm install
  if errorlevel 1 (
    popd
    goto failed
  )
  popd
)

echo Starting the backend on http://localhost:8000 ...
start "ADME backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python -m uvicorn main:app --reload"

echo Starting the frontend on http://localhost:5173 ...
start "ADME frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak >nul
start "" http://localhost:5173

echo.
echo ADME is running. Close the "ADME backend" and "ADME frontend" windows to stop it.
echo Demo login (after running backend\seed_demo.py): bea@example.com / adme12345
exit /b 0

:failed
echo.
echo Setup failed. Read the error above, fix it, and run start.bat again.
pause
exit /b 1
