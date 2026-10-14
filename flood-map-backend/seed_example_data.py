"""
Script para carregar dados de exemplo no banco de dados.

Uso:
  python manage.py shell < seed_example_data.py

Ou:
  python manage.py shell
  >>> exec(open('seed_example_data.py').read())
"""

from django.utils import timezone
from apps.flood.models import CotaAtual, RuaAltimetria, ConfiguracaoCidade

# Limpar dados existentes (opcional)
# CotaAtual.objects.all().delete()
# RuaAltimetria.objects.all().delete()

print("🚀 Carregando dados de exemplo para Lajeado/RS...")

# 1. Criar configuração da cidade
config, created = ConfiguracaoCidade.objects.get_or_create(
    cidade='lajeado',
    defaults={
        'cota_critica': 19.0,
        'cota_min': 3.0,
        'cota_max': 25.0,
        'centro_lat': -29.4669,
        'centro_lon': -51.9611,
        'zoom_padrao': 14,
    }
)
print(f"{'✅ Criada' if created else '⏭️  Já existe'} configuração de Lajeado")

# 2. Criar cota atual de exemplo
cota, created = CotaAtual.objects.update_or_create(
    cidade='lajeado',
    defaults={
        'nivel': 14.21,
        'fonte': 'nivelguaiba',
        'timestamp': timezone.now(),
    }
)
print(f"✅ Cota carregada: {cota.nivel}m (Status: {cota.status})")

# 3. Ruas de exemplo com altimetrias realistas de Lajeado
ruas_dados = [
    {
        'nome': 'Rua Getúlio Vargas',
        'latitude_inicio': -29.4669,
        'longitude_inicio': -51.9611,
        'latitude_fim': -29.4670,
        'longitude_fim': -51.9580,
        'altitude_min': 12.5,
        'altitude_max': 14.2,
        'cota_bloqueio': 14.5,
        'descricao': 'Rua principal do centro, próxima ao Rio Taquari',
    },
    {
        'nome': 'Avenida Brasil',
        'latitude_inicio': -29.4680,
        'longitude_inicio': -51.9600,
        'latitude_fim': -29.4700,
        'longitude_fim': -51.9550,
        'altitude_min': 13.8,
        'altitude_max': 15.5,
        'cota_bloqueio': 15.8,
        'descricao': 'Avenida comercial, zone de risco moderado',
    },
    {
        'nome': 'Rua Mal. Floriano Peixoto',
        'latitude_inicio': -29.4650,
        'longitude_inicio': -51.9620,
        'latitude_fim': -29.4640,
        'longitude_fim': -51.9590,
        'altitude_min': 14.2,
        'altitude_max': 16.1,
        'cota_bloqueio': 16.4,
        'descricao': 'Rua residencial em nível elevado',
    },
    {
        'nome': 'Rua 7 de Setembro',
        'latitude_inicio': -29.4700,
        'longitude_inicio': -51.9630,
        'latitude_fim': -29.4720,
        'longitude_fim': -51.9600,
        'altitude_min': 11.8,
        'altitude_max': 13.5,
        'cota_bloqueio': 13.8,
        'descricao': 'Rua baixa, muito propensa a alagamentos',
    },
    {
        'nome': 'Avenida Taquari',
        'latitude_inicio': -29.4660,
        'longitude_inicio': -51.9640,
        'latitude_fim': -29.4680,
        'longitude_fim': -51.9620,
        'altitude_min': 12.0,
        'altitude_max': 13.8,
        'cota_bloqueio': 14.1,
        'descricao': 'Avenida paralela ao rio, muito vulnerável',
    },
    {
        'nome': 'Rua João Pessoa',
        'latitude_inicio': -29.4630,
        'longitude_inicio': -51.9600,
        'latitude_fim': -29.4620,
        'longitude_fim': -51.9570,
        'altitude_min': 15.5,
        'altitude_max': 17.2,
        'cota_bloqueio': 17.5,
        'descricao': 'Rua em nível elevado, segura em enchentes',
    },
    {
        'nome': 'Rua Duque de Caxias',
        'latitude_inicio': -29.4710,
        'longitude_inicio': -51.9610,
        'latitude_fim': -29.4730,
        'longitude_fim': -51.9580,
        'altitude_min': 13.2,
        'altitude_max': 14.8,
        'cota_bloqueio': 15.1,
        'descricao': 'Rua comercial em zona de risco',
    },
    {
        'nome': 'Rua Tiradentes',
        'latitude_inicio': -29.4640,
        'longitude_inicio': -51.9550,
        'latitude_fim': -29.4660,
        'longitude_fim': -51.9520,
        'altitude_min': 16.8,
        'altitude_max': 18.5,
        'cota_bloqueio': 18.8,
        'descricao': 'Rua em encosta, difícil de alagar',
    },
]

for rua_dados in ruas_dados:
    rua, created = RuaAltimetria.objects.update_or_create(
        cidade='lajeado',
        nome=rua_dados['nome'],
        defaults=rua_dados
    )
    status = '✅ Criada' if created else '⏭️  Já existe'
    print(f"{status}: {rua.nome} (Alt: {rua.altitude_min}-{rua.altitude_max}m, Bloqueio: {rua.cota_bloqueio}m)")

print("\n✅ Dados de exemplo carregados com sucesso!")
print(f"\n📊 Resumo:")
print(f"  - Cota atual: {cota.nivel}m")
print(f"  - Status: {cota.status.upper()}")
print(f"  - Ruas cadastradas: {RuaAltimetria.objects.filter(cidade='lajeado').count()}")
print(f"  - Ruas bloqueadas (nesta cota): {RuaAltimetria.objects.filter(cidade='lajeado', cota_bloqueio__lte=cota.nivel).count()}")
print(f"\n🔗 Próximos passos:")
print(f"  1. Acessar http://localhost:8000/admin/")
print(f"  2. Login com superuser")
print(f"  3. Ir para 'Cotas Atuais' e verificar dados")
print(f"  4. Ir para 'Ruas e Altimetrias' para adicionar mais ruas")
print(f"\n🗺️  Acesse http://localhost:5173 para ver o mapa!")
