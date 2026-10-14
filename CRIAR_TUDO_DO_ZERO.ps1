# ====================================================
# Cria TUDO do zero - Estrutura completa Django
# ====================================================

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     CRIAR ESTRUTURA COMPLETA DO ZERO - DJANGO + REACT      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$PROJECT_ROOT = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $PROJECT_ROOT

Write-Host "Pasta do projeto: $PROJECT_ROOT`n" -ForegroundColor Yellow

# ========== LIMPEZA ==========
Write-Host "[0/15] Limpando pastas antigas..." -ForegroundColor Yellow
if (Test-Path "flood-map-backend") {
    Remove-Item "flood-map-backend" -Recurse -Force
}
if (Test-Path "flood-map-frontend") {
    Write-Host "Mantendo frontend existente..." -ForegroundColor Gray
}

# ========== CRIAR BACKEND DO ZERO ==========
Write-Host "[1/15] Criando pasta backend..." -ForegroundColor Yellow
New-Item -Path "flood-map-backend" -ItemType Directory -Force | Out-Null
Set-Location "flood-map-backend"

Write-Host "[2/15] Criando ambiente virtual..." -ForegroundColor Yellow
python -m venv venv
& ".\venv\Scripts\Activate.ps1"

Write-Host "[3/15] Instalando dependencias Django..." -ForegroundColor Yellow
pip install django djangorestframework django-cors-headers celery redis python-decouple -q

Write-Host "[4/15] Criando projeto Django (config)..." -ForegroundColor Yellow
django-admin startproject config .

Write-Host "[5/15] Criando estrutura de apps..." -ForegroundColor Yellow
New-Item -Path "apps" -ItemType Directory -Force | Out-Null
New-Item -Path "apps\__init__.py" -ItemType File -Force | Out-Null

Write-Host "[6/15] Criando app flood..." -ForegroundColor Yellow
django-admin startapp flood apps/flood

# ========== CRIAR ARQUIVOS ESSENCIAIS ==========
Write-Host "[7/15] Criando models.py..." -ForegroundColor Yellow

$models_content = @"
from django.db import models
from django.utils import timezone

class CotaAtual(models.Model):
    STATUS_CHOICES = [
        ('normal', 'Normal'),
        ('alerta', 'Alerta'),
        ('critica', 'Crítica'),
        ('alagado', 'Alagado'),
    ]
    
    cidade = models.CharField(max_length=100, default='lajeado')
    nivel = models.FloatField()
    timestamp = models.DateTimeField(auto_now=True)
    fonte = models.CharField(max_length=255, default='nivelguaiba.com.br')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='normal')
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Cotas Atuais'
    
    def __str__(self):
        return f"{self.cidade} - {self.nivel}m ({self.status})"


class RuaAltimetria(models.Model):
    cidade = models.CharField(max_length=100, default='lajeado')
    nome = models.CharField(max_length=255)
    lat_inicio = models.FloatField()
    lon_inicio = models.FloatField()
    lat_fim = models.FloatField()
    lon_fim = models.FloatField()
    altitude_min = models.FloatField()
    altitude_max = models.FloatField()
    cota_bloqueio = models.FloatField()
    ativa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = 'Ruas com Altimetria'
    
    def __str__(self):
        return f"{self.nome} ({self.cidade})"


class HistoricoRuaAlagada(models.Model):
    rua = models.ForeignKey(RuaAltimetria, on_delete=models.CASCADE)
    cota_inicio = models.FloatField()
    timestamp_bloqueio = models.DateTimeField(auto_now_add=True)
    timestamp_reabertura = models.DateTimeField(null=True, blank=True)
    duracao_minutos = models.IntegerField(null=True, blank=True)
    
    class Meta:
        verbose_name_plural = 'Histórico de Ruas Alagadas'
    
    def __str__(self):
        return f"{self.rua.nome} - {self.timestamp_bloqueio}"
"@

Set-Content "apps\flood\models.py" $models_content

Write-Host "[8/15] Criando serializers.py..." -ForegroundColor Yellow

$serializers_content = @"
from rest_framework import serializers
from .models import CotaAtual, RuaAltimetria, HistoricoRuaAlagada

class CotaAtualSerializer(serializers.ModelSerializer):
    class Meta:
        model = CotaAtual
        fields = ['id', 'cidade', 'nivel', 'timestamp', 'fonte', 'status']

class RuaAltimetriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RuaAltimetria
        fields = ['id', 'nome', 'lat_inicio', 'lon_inicio', 'lat_fim', 'lon_fim', 'altitude_min', 'altitude_max', 'cota_bloqueio']

class HistoricoRuaAlagadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricoRuaAlagada
        fields = ['id', 'rua', 'cota_inicio', 'timestamp_bloqueio', 'timestamp_reabertura', 'duracao_minutos']
"@

Set-Content "apps\flood\serializers.py" $serializers_content

Write-Host "[9/15] Criando views.py..." -ForegroundColor Yellow

$views_content = @"
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import CotaAtual, RuaAltimetria, HistoricoRuaAlagada
from .serializers import CotaAtualSerializer, RuaAltimetriaSerializer

class CotaAtualView(APIView):
    def get(self, request, cidade='lajeado'):
        try:
            cota = CotaAtual.objects.filter(cidade=cidade).latest('timestamp')
            serializer = CotaAtualSerializer(cota)
            return Response(serializer.data)
        except CotaAtual.DoesNotExist:
            return Response({'erro': f'Nenhuma cota para {cidade}'}, status=status.HTTP_404_NOT_FOUND)

class RuasView(APIView):
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado')
        ruas = RuaAltimetria.objects.filter(cidade=cidade, ativa=True)
        serializer = RuaAltimetriaSerializer(ruas, many=True)
        return Response({'total': ruas.count(), 'ruas': serializer.data})

class RuasAfetadasView(APIView):
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado')
        try:
            cota = CotaAtual.objects.filter(cidade=cidade).latest('timestamp')
            ruas = RuaAltimetria.objects.filter(cidade=cidade, altitude_min__lte=cota.nivel, ativa=True)
            serializer = RuaAltimetriaSerializer(ruas, many=True)
            return Response({'cota': cota.nivel, 'ruas': serializer.data, 'total': ruas.count()})
        except CotaAtual.DoesNotExist:
            return Response({'ruas': []}, status=status.HTTP_404_NOT_FOUND)

class MapaStatusView(APIView):
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado')
        try:
            cota = CotaAtual.objects.filter(cidade=cidade).latest('timestamp')
            ruas = RuaAltimetria.objects.filter(cidade=cidade, ativa=True)
            afetadas = ruas.filter(altitude_min__lte=cota.nivel)
            return Response({
                'cota': cota.nivel,
                'status': cota.status,
                'ruas_total': ruas.count(),
                'ruas_bloqueadas': afetadas.count(),
                'centro': {'lat': -29.4669, 'lng': -51.9611}
            })
        except:
            return Response({'erro': 'Sem dados'}, status=404)

class HistoricoView(APIView):
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado')
        dias = int(request.query_params.get('dias', 7))
        data_inicio = timezone.now() - timedelta(days=dias)
        historico = HistoricoRuaAlagada.objects.filter(rua__cidade=cidade, timestamp_bloqueio__gte=data_inicio)
        return Response({'total': historico.count(), 'historico': []})

class RelatorioDiarioView(APIView):
    def get(self, request):
        return Response({'relatorio': []})

class CotasTimeseriesView(APIView):
    def get(self, request):
        return Response({'dados': []})
"@

Set-Content "apps\flood\views.py" $views_content

Write-Host "[10/15] Criando urls.py (app)..." -ForegroundColor Yellow

$urls_content = @"
from django.urls import path
from . import views

app_name = 'flood'

urlpatterns = [
    path('v1/cota/', views.CotaAtualView.as_view(), name='cota'),
    path('v1/cota/<str:cidade>/', views.CotaAtualView.as_view(), name='cota-cidade'),
    path('v1/ruas/', views.RuasView.as_view(), name='ruas'),
    path('v1/ruas/afetadas/', views.RuasAfetadasView.as_view(), name='ruas-afetadas'),
    path('v1/mapa/status/', views.MapaStatusView.as_view(), name='mapa-status'),
    path('v1/historico/alagamentos/', views.HistoricoView.as_view(), name='historico'),
    path('v1/relatorio/diario/', views.RelatorioDiarioView.as_view(), name='relatorio'),
    path('v1/cotas/timeseries/', views.CotasTimeseriesView.as_view(), name='timeseries'),
]
"@

Set-Content "apps\flood\urls.py" $urls_content

Write-Host "[11/15] Atualizando settings.py..." -ForegroundColor Yellow

$settings_path = "config\settings.py"
$settings = Get-Content $settings_path -Raw

# Remover INSTALLED_APPS antiga e adicionar nova
$settings = $settings -replace "INSTALLED_APPS = \[[^\]]*\]", @"
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'apps.flood',
]
"@

# Remover MIDDLEWARE antiga e adicionar nova
$settings = $settings -replace "MIDDLEWARE = \[[^\]]*\]", @"
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]
"@

# Adicionar CORS no final
if (-not ($settings -match "CORS_ALLOWED_ORIGINS")) {
    $settings += @"

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
}
"@
}

Set-Content $settings_path $settings

Write-Host "[12/15] Atualizando config/urls.py..." -ForegroundColor Yellow

$main_urls = @"
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.flood.urls')),
]
"@

Set-Content "config\urls.py" $main_urls

Write-Host "[13/15] Executando migrações..." -ForegroundColor Yellow
python manage.py migrate

Write-Host "[14/15] Criando superuser..." -ForegroundColor Yellow
python manage.py createsuperuser --noinput --username admin --email admin@example.com 2>$null
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); u = User.objects.filter(username='admin').first(); u and u.set_password('admin123') and u.save()" 2>$null

Write-Host "[15/15] Carregando dados de exemplo..." -ForegroundColor Yellow

$seed_data = @"
from apps.flood.models import CotaAtual, RuaAltimetria

# Criar cota inicial
CotaAtual.objects.create(cidade='lajeado', nivel=12.5, status='normal', fonte='seed_data')

# Criar ruas de exemplo
ruas = [
    ('Rua Getúlio Vargas', -29.4650, -51.9600, -29.4655, -51.9595, 12.5, 14.2, 14.5),
    ('Avenida Brasil', -29.4670, -51.9610, -29.4675, -51.9605, 13.8, 15.5, 15.8),
    ('Rua Mal. Floriano Peixoto', -29.4680, -51.9620, -29.4685, -51.9615, 14.2, 16.1, 16.4),
    ('Rua 7 de Setembro', -29.4640, -51.9590, -29.4645, -51.9585, 11.8, 13.5, 13.8),
    ('Avenida Taquari', -29.4660, -51.9630, -29.4665, -51.9625, 12.0, 13.8, 14.1),
    ('Rua João Pessoa', -29.4690, -51.9600, -29.4695, -51.9595, 15.5, 17.2, 17.5),
    ('Rua Duque de Caxias', -29.4670, -51.9640, -29.4675, -51.9635, 13.2, 14.8, 15.1),
    ('Rua Tiradentes', -29.4650, -51.9620, -29.4655, -51.9615, 16.8, 18.5, 18.8),
]

for nome, lat1, lon1, lat2, lon2, alt_min, alt_max, cota in ruas:
    RuaAltimetria.objects.get_or_create(
        nome=nome,
        defaults={
            'cidade': 'lajeado',
            'lat_inicio': lat1,
            'lon_inicio': lon1,
            'lat_fim': lat2,
            'lon_fim': lon2,
            'altitude_min': alt_min,
            'altitude_max': alt_max,
            'cota_bloqueio': cota,
            'ativa': True,
        }
    )

print('✅ Dados carregados!')
"@

Set-Content "seed_data.py" $seed_data
Get-Content seed_data.py | python manage.py shell

# ========== FRONTEND ==========
Set-Location $PROJECT_ROOT

Write-Host "`n✅ BACKEND CRIADO COM SUCESSO!`n" -ForegroundColor Green

Write-Host "Estrutura criada:" -ForegroundColor Cyan
Write-Host "
flood-map-backend/
├── config/                  (projeto Django)
│   ├── __init__.py
│   ├── settings.py          ✅ Configurado
│   ├── urls.py              ✅ Configurado
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── __init__.py
│   └── flood/               (seu app)
│       ├── __init__.py
│       ├── models.py        ✅ Criado
│       ├── views.py         ✅ Criado
│       ├── serializers.py   ✅ Criado
│       ├── urls.py          ✅ Criado
│       ├── admin.py
│       ├── apps.py
│       ├── migrations/
│       │   ├── __init__.py
│       │   └── 0001_...
│       └── tests.py
├── manage.py                ✅ Pronto
├── db.sqlite3               ✅ Banco criado
├── venv/                    ✅ Ambiente virtual
└── seed_data.py
" -ForegroundColor White

Write-Host "`n📋 PROXIMAS ACOES:" -ForegroundColor Yellow
Write-Host "1️⃣  Abra 3 PowerShells`n" -ForegroundColor White

Write-Host "2️⃣  Terminal 1 - Backend:" -ForegroundColor Yellow
Write-Host "    cd flood-map-backend" -ForegroundColor Gray
Write-Host "    venv\Scripts\activate" -ForegroundColor Gray
Write-Host "    python manage.py runserver`n" -ForegroundColor Gray

Write-Host "3️⃣  Terminal 2 - Frontend:" -ForegroundColor Yellow
Write-Host "    cd flood-map-frontend" -ForegroundColor Gray
Write-Host "    npm install" -ForegroundColor Gray
Write-Host "    npm run dev`n" -ForegroundColor Gray

Write-Host "4️⃣  Acesse:" -ForegroundColor Yellow
Write-Host "    http://localhost:5173`n" -ForegroundColor Gray

Write-Host "════════════════════════════════════════════`n" -ForegroundColor Green
