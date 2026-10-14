# ====================================================
# Cria toda a estrutura Django automaticamente
# Salve este arquivo com codificação UTF-8 com BOM
# ====================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "Criando estrutura Django completa..." -ForegroundColor Cyan

$PROJECT_ROOT = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $PROJECT_ROOT

# Criar pasta backend se não existir
if (-not (Test-Path "flood-map-backend")) {
    New-Item -Path "flood-map-backend" -ItemType Directory -Force | Out-Null
}

Set-Location "flood-map-backend"

# ========== 1. Criar ambiente virtual ==========
Write-Host "[1/10] Criando ambiente virtual..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    python -m venv venv
}
& ".\venv\Scripts\Activate.ps1"

# ========== 2. Instalar dependências ==========
Write-Host "[2/10] Instalando dependências..." -ForegroundColor Yellow
python -m pip install --upgrade pip -q
pip install django djangorestframework django-cors-headers celery redis -q

# ========== 3. Criar projeto Django ==========
Write-Host "[3/10] Criando projeto Django (config)..." -ForegroundColor Yellow
if (-not (Test-Path "manage.py")) {
    django-admin startproject config .
}

# ========== 4. Criar app flood e ajustar apps.py ==========
Write-Host "[4/10] Criando app flood..." -ForegroundColor Yellow
if (-not (Test-Path "apps")) {
    New-Item -Path "apps" -ItemType Directory -Force | Out-Null
    New-Item -Path "apps\__init__.py" -ItemType File -Force | Out-Null
}

if (-not (Test-Path "apps\flood")) {
    django-admin startapp flood apps/flood
    New-Item -Path "apps\flood\__init__.py" -ItemType File -Force | Out-Null
}

# CORREÇÃO CRUCIAL: Ajustar name para 'apps.flood' no apps.py
$appsPyPath = "apps\flood\apps.py"
$appsPyContent = @'
from django.apps import AppConfig

class FloodConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.flood'
'@
Set-Content -Path $appsPyPath -Value $appsPyContent -Encoding UTF8

# ========== 5. Copiar ou criar models.py, views.py, serializers.py ==========
Write-Host "[5/10] Configurando models.py..." -ForegroundColor Yellow
if (Test-Path "..\flood_models.py") {
    Copy-Item "..\flood_models.py" "apps\flood\models.py" -Force
} elseif (-not (Test-Path "apps\flood\models.py")) {
    Set-Content -Path "apps\flood\models.py" -Value "from django.db import models`n" -Encoding UTF8
}

Write-Host "[6/10] Configurando views.py..." -ForegroundColor Yellow
if (Test-Path "..\flood_views_COMPLETO.py") {
    Copy-Item "..\flood_views_COMPLETO.py" "apps\flood\views.py" -Force
} elseif (-not (Test-Path "apps\flood\views.py")) {
    Set-Content -Path "apps\flood\views.py" -Value "from rest_framework.response import Response`nfrom rest_framework.decorators import api_view`n`n@api_view(['GET'])`ndef status_view(request):`n    return Response({'status': 'ok'})`n" -Encoding UTF8
}

Write-Host "[7/10] Configurando serializers.py..." -ForegroundColor Yellow
if (Test-Path "..\flood_serializers.py") {
    Copy-Item "..\flood_serializers.py" "apps\flood\serializers.py" -Force
} elseif (-not (Test-Path "apps\flood\serializers.py")) {
    Set-Content -Path "apps\flood\serializers.py" -Value "from rest_framework import serializers`n" -Encoding UTF8
}

Write-Host "[8/10] Configurando URLs do app flood..." -ForegroundColor Yellow
if (Test-Path "..\flood_urls_COMPLETO.py") {
    Copy-Item "..\flood_urls_COMPLETO.py" "apps\flood\urls.py" -Force
} else {
    $appUrlsContent = @'
from django.urls import path
from . import views

urlpatterns = [
    path('status/', getattr(views, 'status_view', None) or (lambda r: None), name='status'),
]
'@
    Set-Content -Path "apps\flood\urls.py" -Value $appUrlsContent -Encoding UTF8
}

# ========== 9. Configurar settings.py ==========
Write-Host "[9/10] Configurando settings.py..." -ForegroundColor Yellow
$settings_path = "config\settings.py"
$settings_content = Get-Content $settings_path -Raw

# Adicionar apps se ainda não presentes
if (-not ($settings_content -match "'apps\.flood'")) {
    $settings_content = $settings_content -replace "INSTALLED_APPS = \[", @"
INSTALLED_APPS = [
    'rest_framework',
    'corsheaders',
    'apps.flood',
"@
}

# Adicionar CorsMiddleware no topo dos middlewares
if (-not ($settings_content -match "'corsheaders\.middleware\.CorsMiddleware'")) {
    $settings_content = $settings_content -replace "MIDDLEWARE = \[", @"
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
"@
}

# Adicionar configurações de CORS e REST Framework se ausentes
if (-not ($settings_content -match "CORS_ALLOWED_ORIGINS")) {
    $settings_content += @"

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
}
"@
}

Set-Content -Path $settings_path -Value $settings_content -Encoding UTF8

# ========== 10. Configurar URLs principais ==========
Write-Host "[10/10] Configurando URLs principais..." -ForegroundColor Yellow
$urls_path = "config\urls.py"
$urls_content = @'
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.flood.urls')),
]
'@
Set-Content -Path $urls_path -Value $urls_content -Encoding UTF8

# ========== Executar migrações ==========
Write-Host "`nExecutando migrações..." -ForegroundColor Yellow
python manage.py makemigrations flood
python manage.py migrate

# ========== Criar superuser ==========
Write-Host "Criando superuser (admin / admin123)..." -ForegroundColor Yellow
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123')" 2>$null

# ========== Carregar dados de exemplo ==========
if (Test-Path "seed_example_data.py") {
    Write-Host "Carregando dados de exemplo..." -ForegroundColor Yellow
    Get-Content seed_example_data.py | python manage.py shell 2>$null
}

# ========== Resumo da estrutura (Aqui usamos Here-String com aspas simples) ==========
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "ESTRUTURA DJANGO CRIADA COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

$treeView = @'
flood-map-backend/
|-- config/              [projeto Django]
|   |-- settings.py      [configurado]
|   |-- urls.py          [configurado]
|   |-- wsgi.py
|   `-- asgi.py
|-- apps/
|   `-- flood/           [app flood]
|       |-- apps.py      [name = 'apps.flood']
|       |-- models.py
|       |-- views.py
|       |-- serializers.py
|       |-- urls.py
|       `-- migrations/
|-- manage.py
|-- venv/
`-- db.sqlite3
'@

Write-Host "`nEstrutura criada:`n$treeView" -ForegroundColor White

Write-Host "`nPROXIMAS ACOES:" -ForegroundColor Yellow
Write-Host "1. Terminal 1 (Django):" -ForegroundColor White
Write-Host "   cd flood-map-backend; .\venv\Scripts\activate; python manage.py runserver" -ForegroundColor Gray
Write-Host "2. Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "   cd flood-map-frontend; npm run dev" -ForegroundColor Gray
Write-Host "3. Terminal 3 (Celery - se aplicavel):" -ForegroundColor White
Write-Host "   cd flood-map-backend; .\venv\Scripts\activate; celery -A config worker -l info" -ForegroundColor Gray
Write-Host "`nSuperuser: admin / admin123`n" -ForegroundColor Green