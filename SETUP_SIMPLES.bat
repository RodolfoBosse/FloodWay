@echo off
setlocal enabledelayedexpansion

echo.
echo ===== SETUP MAPA DE ENCHENTES =====
echo.

REM Detecta pasta
set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

REM Verifica estrutura
if not exist "flood-map-backend" (
    echo ERRO: Pasta flood-map-backend nao encontrada!
    pause
    exit /b 1
)

REM Backend
echo [1/5] Configurando Backend Django...
cd /d "%PROJECT_ROOT%flood-map-backend"

if not exist "venv" (
    echo Criando venv...
    python -m venv venv
)

echo Ativando venv...
call venv\Scripts\activate.bat

echo Instalando dependencias...
pip install -r requirements.txt -q

echo [2/5] Executando migracao...
python manage.py migrate

echo [3/5] Criando admin...
python manage.py createsuperuser --noinput --username admin --email admin@example.com 2>nul
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); u = User.objects.filter(username='admin').first(); u and u.set_password('admin123') and u.save()" 2>nul

echo [4/5] Carregando dados...
if exist "seed_example_data.py" (
    Get-Content seed_example_data.py 2>nul | python manage.py shell 2>nul
)

REM Frontend
echo [5/5] Configurando Frontend...
cd /d "%PROJECT_ROOT%flood-map-frontend"

if not exist "node_modules" (
    call npm install --silent
)

echo.
echo ===== PRONTO! =====
echo.
echo Abra 4 terminais e execute:
echo.
echo Terminal 1: cd %PROJECT_ROOT%flood-map-backend & venv\Scripts\activate & python manage.py runserver
echo Terminal 2: cd %PROJECT_ROOT%flood-map-frontend & npm run dev
echo Terminal 3: cd %PROJECT_ROOT%flood-map-backend & venv\Scripts\activate & celery -A config worker -l info
echo.
echo Depois acesse: http://localhost:5173
echo.
pause
