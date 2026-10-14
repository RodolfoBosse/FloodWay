import os
import django
import requests
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.flood.models import RuaAltimetria

ELEVATION_API = "https://api.open-meteo.com/v1/elevation"
HEADERS = {'User-Agent': 'FloodWaySegmentElev/8.0 (contato: eng@floodway.local)'}

def obter_elevacoes_em_lote(pontos):
    if not pontos:
        return []
    lats = ",".join([f"{p[0]:.5f}" for p in pontos])
    lons = ",".join([f"{p[1]:.5f}" for p in pontos])
    try:
        url = f"{ELEVATION_API}?latitude={lats}&longitude={lons}"
        res = requests.get(url, headers=HEADERS, timeout=15)
        if res.status_code == 200:
            return res.json().get('elevation', [])
    except Exception as e:
        print(f"Erro elevação: {e}")
    return [18.0] * len(pontos)

def segmentar_altimetria():
    ruas = RuaAltimetria.objects.filter(coordenadas_json__isnull=False)
    print(f"🔍 Analisando {ruas.count()} ruas para segmentação altimétrica...")

    atualizadas = 0
    for rua in ruas:
        coords = rua.coordenadas_json
        if not coords or not isinstance(coords, list):
            continue

        # Identifica se é lista de quarteirões
        lista_quarteiroes = []
        if isinstance(coords[0], dict) and 'coords' in coords[0]:
            # Já é formato segmentado
            continue
        elif isinstance(coords[0], list) and len(coords[0]) > 0 and isinstance(coords[0][0], list):
            lista_quarteiroes = coords
        else:
            lista_quarteiroes = [coords]

        # Pega o ponto central de cada quarteirão para calcular sua altitude individual
        pontos_centrais = []
        for q in lista_quarteiroes:
            if len(q) >= 2:
                meio = q[len(q) // 2]
                pontos_centrais.append(meio)
            elif len(q) == 1:
                pontos_centrais.append(q[0])

        if not pontos_centrais:
            continue

        elevacoes = obter_elevacoes_em_lote(pontos_centrais)

        # Monta os segmentos ricos com cota individual por trecho
        novos_segmentos = []
        todas_altitudes = []
        for i, q in enumerate(lista_quarteiroes):
            alt = elevacoes[i] if i < len(elevacoes) else rua.cota_bloqueio
            alt = round(float(alt), 1)
            todas_altitudes.append(alt)
            novos_segmentos.append({
                'cota': alt,
                'coords': q
            })

        rua.coordenadas_json = novos_segmentos
        if todas_altitudes:
            rua.altitude_min = min(todas_altitudes)
            rua.altitude_max = max(todas_altitudes)
            rua.cota_bloqueio = rua.altitude_min
        rua.save(update_fields=['coordenadas_json', 'altitude_min', 'altitude_max', 'cota_bloqueio'])
        atualizadas += 1
        time.sleep(0.05)

    print(f"\n🎉 Sucesso absoluto! {atualizadas} ruas agora possuem cotas individuais por quarteirão!")

if __name__ == '__main__':
    segmentar_altimetria()
