Write-Host "=== SETUP MAPA DE ENCHENTES ===" -ForegroundColor Cyan

$PROJECT_ROOT = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $PROJECT_ROOT

Write-Host "[1/5] Backend Django..." -ForegroundColor Yellow
Set-Location "$PROJECT_ROOT\flood-map-backend"

if (-not (Test-Path "venv")) {
    python -m venv venv
}

& ".\venv\Scripts\Activate.ps1"
pip install -r requirements.txt -q
python manage.py migrate
python manage.py createsuperuser --noinput --username admin --email admin@example.com 2>$null
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); u = User.objects.filter(username='admin').first(); u and u.set_password('admin123') and u.save()" 2>$null

Write-Host "[2/5] Dados de exemplo..." -ForegroundColor Yellow
if (Test-Path "seed_example_data.py") {
    Get-Content seed_example_data.py | python manage.py shell 2>$null
}

Write-Host "[3/5] Frontend React..." -ForegroundColor Yellow
Set-Location "$PROJECT_ROOT\flood-map-frontend"

if (-not (Test-Path "node_modules")) {
    npm install --silent
}

Write-Host "[4/5] Arquivo .env..." -ForegroundColor Yellow
"VITE_API_BASE_URL=http://localhost:8000/api" | Set-Content ".env.local"

Write-Host "[5/5] Pronto!" -ForegroundColor Green

Write-Host "`n=== PROXIMO PASSO ===" -ForegroundColor Cyan
Write-Host "Abra 4 PowerShells e execute:" -ForegroundColor White
Write-Host "`nTerminal 1:" -ForegroundColor Yellow
Write-Host "cd $PROJECT_ROOT\flood-map-backend`nvenv\Scripts\activate`npython manage.py runserver" -ForegroundColor Gray

Write-Host "`nTerminal 2:" -ForegroundColor Yellow
Write-Host "cd $PROJECT_ROOT\flood-map-frontend`nnpm run dev" -ForegroundColor Gray

Write-Host "`nTerminal 3:" -ForegroundColor Yellow
Write-Host "cd $PROJECT_ROOT\flood-map-backend`nvenv\Scripts\activate`ncelery -A config worker -l info" -ForegroundColor Gray

Write-Host "`nDepois acesse: http://localhost:5173" -ForegroundColor Cyan
Write-Host "`n"
