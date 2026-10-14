# Guia de Instalação e Implementação - Mapa de Enchentes Lajeado/RS

## 📋 Pré-requisitos

Você vai precisar:
- Python 3.9+
- PostgreSQL 12+ (banco de dados)
- Redis 6+ (cache e message broker do Celery)
- Node.js 16+ (para o frontend React)
- Git

### Verificar instalações:
```bash
python --version
psql --version
redis-cli --version
node --version
npm --version
```

---

## 🎯 FASE 1: Preparação do Ambiente

### 1.1 Clonar/Criar projeto
```bash
mkdir flood-map
cd flood-map

# Se estiver usando Git
git init

# Ou apenas organize assim:
# flood-map-backend/  ← seu Django
# flood-map-frontend/ ← seu React (depois)
```

### 1.2 Criar ambiente virtual Python
```bash
python -m venv venv

# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 1.3 Instalar dependências
```bash
cd flood-map-backend
pip install -r requirements.txt
```

### 1.4 Criar arquivo .env
```bash
# flood-map-backend/.env

SECRET_KEY=seu-chave-super-secreta-aqui-mude-em-producao
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,flood-map.local

# Database
DB_NAME=flood_map
DB_USER=postgres
DB_PASSWORD=sua-senha-postgres
DB_HOST=localhost
DB_PORT=5432

# Redis/Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS (frontend)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 🗄️ FASE 2: Configuração do PostgreSQL

### 2.1 Criar banco de dados
```bash
# Linux/Mac
psql -U postgres

# Windows (se tiver psql no PATH)
psql -U postgres

# Dentro do psql:
CREATE DATABASE flood_map;
CREATE USER flood_admin WITH PASSWORD 'sua-senha-segura';
ALTER ROLE flood_admin SET client_encoding TO 'utf8';
ALTER ROLE flood_admin SET default_transaction_isolation TO 'read committed';
ALTER ROLE flood_admin SET default_transaction_deferrable TO on;
ALTER ROLE flood_admin SET default_transaction_level TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE flood_map TO flood_admin;
\q
```

### 2.2 Verificar conexão
```bash
psql -U flood_admin -d flood_map -h localhost
# Se conectar, está funcionando!
\q
```

---

## 🔧 FASE 3: Configurar Django

### 3.1 Estrutura de pastas correta
Organize assim:
```
flood-map-backend/
├── config/
│   ├── __init__.py
│   ├── settings.py         ← copiar do config_settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── __init__.py
│   └── flood/
│       ├── __init__.py
│       ├── admin.py        ← criar depois
│       ├── apps.py
│       ├── models.py       ← copiar do flood_models.py
│       ├── serializers.py  ← copiar do flood_serializers.py
│       ├── views.py        ← copiar do flood_views.py
│       ├── urls.py         ← copiar do flood_urls.py
│       ├── tasks.py        ← copiar do flood_tasks.py
│       └── migrations/
│           └── __init__.py
├── manage.py
├── requirements.txt
└── .env
```

### 3.2 Criar projeto Django
```bash
django-admin startproject config .
django-admin startapp flood apps/flood
```

### 3.3 Atualizar config/settings.py
- Copiar o conteúdo de `config_settings.py`
- Ajustar variáveis de ambiente

### 3.4 Atualizar config/urls.py
```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.flood.urls')),
]
```

### 3.5 Copiar modelos, views, serializers
- `flood_models.py` → `apps/flood/models.py`
- `flood_views.py` → `apps/flood/views.py`
- `flood_serializers.py` → `apps/flood/serializers.py`
- `flood_tasks.py` → `apps/flood/tasks.py`
- `flood_urls.py` → `apps/flood/urls.py`

### 3.6 Criar celery.py na config/
```python
# config/celery.py

import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('flood_map')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
```

### 3.7 Atualizar config/__init__.py
```python
from .celery import app as celery_app

__all__ = ('celery_app',)
```

---

## 📊 FASE 4: Banco de Dados

### 4.1 Criar migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4.2 Criar superusuário (admin)
```bash
python manage.py createsuperuser
# Email: seu-email@example.com
# Password: seu-password-seguro
```

### 4.3 Registrar models no admin
```python
# apps/flood/admin.py

from django.contrib import admin
from .models import CotaAtual, RuaAltimetria, HistoricoRuaAlagada, RotaCalculada

@admin.register(CotaAtual)
class CotaAtualAdmin(admin.ModelAdmin):
    list_display = ('cidade', 'nivel', 'status', 'timestamp', 'fonte')
    list_filter = ('cidade', 'status', 'timestamp')
    search_fields = ('cidade',)
    readonly_fields = ('timestamp',)

@admin.register(RuaAltimetria)
class RuaAltimetriaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cidade', 'altitude_min', 'altitude_max', 'cota_bloqueio', 'ativa')
    list_filter = ('cidade', 'ativa', 'cota_bloqueio')
    search_fields = ('nome', 'cidade')
    fieldsets = (
        ('Identificação', {
            'fields': ('cidade', 'nome', 'descricao', 'ativa')
        }),
        ('Localização Início', {
            'fields': ('latitude_inicio', 'longitude_inicio')
        }),
        ('Localização Fim', {
            'fields': ('latitude_fim', 'longitude_fim')
        }),
        ('Altimetria', {
            'fields': ('altitude_min', 'altitude_max', 'cota_bloqueio')
        }),
    )

@admin.register(HistoricoRuaAlagada)
class HistoricoRuaAlagadaAdmin(admin.ModelAdmin):
    list_display = ('rua', 'cota_inicio', 'timestamp_bloqueio', 'duracao_minutos')
    list_filter = ('rua__cidade', 'timestamp_bloqueio')
    search_fields = ('rua__nome',)
    readonly_fields = ('timestamp_bloqueio', 'duracao_minutos')

@admin.register(RotaCalculada)
class RotaCalculadaAdmin(admin.ModelAdmin):
    list_display = ('id', 'cota_no_momento', 'tipo_navegacao', 'timestamp')
    list_filter = ('tipo_navegacao', 'timestamp')
    readonly_fields = ('timestamp',)
```

### 4.4 Carregar ruas de exemplo
```python
# Crie um script: seed_data.py

from django.core.management.base import BaseCommand
from apps.flood.models import RuaAltimetria

class Command(BaseCommand):
    def handle(self, *args, **options):
        ruas = [
            {
                'nome': 'Rua Getúlio Vargas',
                'latitude_inicio': -29.4669,
                'longitude_inicio': -51.9611,
                'latitude_fim': -29.4670,
                'longitude_fim': -51.9600,
                'altitude_min': 12.5,
                'altitude_max': 14.2,
                'cota_bloqueio': 14.5,
            },
            # ... mais ruas
        ]
        
        for rua_data in ruas:
            RuaAltimetria.objects.get_or_create(
                cidade='lajeado',
                nome=rua_data['nome'],
                defaults=rua_data
            )
        
        self.stdout.write(self.style.SUCCESS('Ruas carregadas!'))
```

Executar:
```bash
python manage.py seed_data
```

---

## ⚙️ FASE 5: Redis e Celery

### 5.1 Iniciar Redis (em outro terminal)
```bash
# Linux/Mac
redis-server

# Ou com homebrew (Mac)
brew services start redis

# Verificar
redis-cli ping
# Deve retornar: PONG
```

### 5.2 Iniciar Celery Worker (em outro terminal)
```bash
# Na pasta flood-map-backend com venv ativado
celery -A config worker -l info
```

### 5.3 Iniciar Celery Beat (em outro terminal, APENAS se usar schedule)
```bash
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

## 🚀 FASE 6: Testar Backend

### 6.1 Iniciar servidor Django
```bash
python manage.py runserver
```

Acessar:
- Admin: `http://localhost:8000/admin/`
- API Status: `http://localhost:8000/api/v1/mapa/status/`

### 6.2 Testar endpoints
```bash
# Terminal novo
curl http://localhost:8000/api/v1/cota/

curl http://localhost:8000/api/v1/ruas/

curl "http://localhost:8000/api/v1/ruas/afetadas/?cidade=lajeado&cota=14.5"
```

### 6.3 Verificar Celery
No terminal onde rodou celery, veja se as tasks chegam

Forçar execução:
```bash
python manage.py shell
>>> from apps.flood.tasks import update_cota_lajeado
>>> update_cota_lajeado.delay()
```

---

## 📝 FASE 7: Dados Iniciais

### 7.1 Adicionar cota manual (via admin ou shell)
```bash
python manage.py shell

>>> from apps.flood.models import CotaAtual
>>> CotaAtual.objects.create(
...     cidade='lajeado',
...     nivel=14.21,
...     fonte='nivelguaiba'
... )
```

### 7.2 Adicionar ruas (ver seed_data.py acima)

---

## 🎨 FASE 8: Frontend React (próximo)

Quando estiver pronto, criar frontend em:
```
flood-map-frontend/
├── src/
├── package.json
├── vite.config.js (se usar Vite)
└── ... (estrutura padrão React)
```

---

## 📋 Checklist Resumido

- [ ] Python venv criado e ativado
- [ ] requirements.txt instalado
- [ ] .env criado
- [ ] PostgreSQL banco criado
- [ ] Django configurado
- [ ] Migrations executadas
- [ ] Superusuário criado
- [ ] Modelos em apps/flood/
- [ ] Redis rodando
- [ ] Celery worker rodando
- [ ] Django servidor rodando
- [ ] Admin acessível
- [ ] API respondendo
- [ ] Ruas carregadas no BD

---

## 🔗 URLs Úteis

| Recurso | URL |
|---------|-----|
| Admin | http://localhost:8000/admin/ |
| Status Mapa | http://localhost:8000/api/v1/mapa/status/ |
| Cota Atual | http://localhost:8000/api/v1/cota/ |
| Ruas | http://localhost:8000/api/v1/ruas/ |
| Ruas Afetadas | http://localhost:8000/api/v1/ruas/afetadas/ |
| Histórico | http://localhost:8000/api/v1/historico/alagamentos/ |
| Relatório | http://localhost:8000/api/v1/relatorio/diario/ |
| Séries Temporais | http://localhost:8000/api/v1/cotas/timeseries/ |

---

## 🆘 Troubleshooting

### Erro: `ModuleNotFoundError: No module named 'django'`
→ Verificar se venv está ativado e pip install -r requirements.txt foi executado

### Erro: `connection refused` no PostgreSQL
→ Verificar se PostgreSQL está rodando (service postgresql start)

### Erro: `connection refused` no Redis
→ Verificar se Redis está rodando (redis-server)

### Celery tasks não executam
→ Verificar se worker está rodando: `celery -A config worker -l info`

---

Próximo passo: Implementar frontend React!
