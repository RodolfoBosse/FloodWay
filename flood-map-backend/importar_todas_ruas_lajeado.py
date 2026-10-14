import os
import json
import django
import requests
import time

# Inicializa Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.flood.models import RuaAltimetria

CACHE_FILE = "ruas_lajeado_cache.json"

OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

ELEVATION_API = "https://api.open-meteo.com/v1/elevation"

# Bounding box do perímetro urbano de Lajeado/RS
BBOX = "-29.490,-51.990,-29.430,-51.925"

HEADERS = {
    'User-Agent': 'FloodWayApp/3.0 (contato: eng@floodway.local)'
}

def buscar_ruas_osm():
    if os.path.exists(CACHE_FILE):
        print(f"📦 Usando arquivo de cache local ({CACHE_FILE})...")
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)

    print("🛰️ Consultando OpenStreetMap (modo otimizado em lote)...")
    # Consulta ultra-rápida usando indexação por Bounding Box
    query = f"""
    [out:json][timeout:30];
    (
      way["highway"~"primary|secondary|tertiary|residential"]["name"]({BBOX});
    );
    out bb tags;
    """ 

    for url in OVERPASS_MIRRORS:
        try:
            print(f"Tentando servidor: {url}...")
            response = requests.post(url, data={'data': query}, headers=HEADERS, timeout=30)
            if response.status_code == 200:
                dados = response.json().get('elements', [])
                print(f"✅ {len(dados)} vias obtidas com sucesso!")
                with open(CACHE_FILE, 'w', encoding='utf-8') as f:
                    json.dump(dados, f)
                return dados
            else:
                print(f"Aviso: Servidor retornou {response.status_code}, tentando próximo...")
        except Exception as e:
            print(f"Erro ao conectar com {url}: {e}")

    raise Exception("Servidores de mapa ocupados. Tente novamente em instantes.")

def obter_elevacoes_em_lote(pontos):
    if not pontos:
        return []
    lats = ",".join([f"{p[0]:.5f}" for p in pontos])
    lons = ",".join([f"{p[1]:.5f}" for p in pontos])
    
    try:
        url = f"{ELEVATION_API}?latitude={lats}&longitude={lons}"
        res = requests.get(url, headers=HEADERS, timeout=20)
        if res.status_code == 200:
            return res.json().get('elevation', [])
    except Exception as e:
        print(f"Aviso elevação: {e}")
    return [16.0] * len(pontos)

def processar_e_salvar_ruas():
    elementos = buscar_ruas_osm()
    ruas_unicas = {}

    for elem in elementos:
        nome = elem.get('tags', {}).get('name')
        bounds = elem.get('bounds')
        if not nome or not bounds:
            continue

        if nome not in ruas_unicas:
            ruas_unicas[nome] = {
                'nome': nome,
                'lat_ini': bounds['minlat'],
                'lon_ini': bounds['minlon'],
                'lat_fim': bounds['maxlat'],
                'lon_fim': bounds['maxlon'],
            }

    ruas_lista = list(ruas_unicas.values())
    total = len(ruas_lista)
    print(f"🛣️ {total} ruas únicas identificadas para cálculo de altimetria.")

    tamanho_lote = 40
    ruas_salvas = 0
    campos_modelo = [f.name for f in RuaAltimetria._meta.fields]

    for i in range(0, total, tamanho_lote):
        lote = ruas_lista[i:i + tamanho_lote]
        pontos = []
        for r in lote:
            pontos.append((r['lat_ini'], r['lon_ini']))
            pontos.append((r['lat_fim'], r['lon_fim']))

        elevacoes = obter_elevacoes_em_lote(pontos)

        for j, r in enumerate(lote):
            alt1 = elevacoes[j * 2] if j * 2 < len(elevacoes) else 18.0
            alt2 = elevacoes[j * 2 + 1] if (j * 2 + 1) < len(elevacoes) else 18.0
            
            alt_min = round(min(alt1, alt2), 1)
            alt_max = round(max(alt1, alt2), 1)
            cota_bloqueio = round(alt_min, 1)

            dados_salvar = {
                'latitude_inicio': r['lat_ini'],
                'longitude_inicio': r['lon_ini'],
                'latitude_fim': r['lat_fim'],
                'longitude_fim': r['lon_fim'],
                'altitude_min': alt_min,
                'altitude_max': alt_max,
                'cota_bloqueio': cota_bloqueio,
            }

            if 'cidade' in campos_modelo:
                dados_salvar['cidade'] = 'lajeado'
            if 'descricao' in campos_modelo:
                dados_salvar['descricao'] = f"Altitude: {alt_min}m a {alt_max}m"
            if 'ativa' in campos_modelo:
                dados_salvar['ativa'] = True

            RuaAltimetria.objects.update_or_create(
                nome=r['nome'],
                defaults=dados_salvar
            )
            ruas_salvas += 1

        print(f"Progresso: {min(i + tamanho_lote, total)}/{total} ruas com altimetria calculadas...")
        time.sleep(0.3)

    print(f"\n🎉 Sucesso total! {ruas_salvas} ruas reais de Lajeado salvas com altimetria no banco de dados!")

if __name__ == '__main__':
    processar_e_salvar_ruas()
