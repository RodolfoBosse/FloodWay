import os
import django
import json
import urllib.request
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.flood.models import RuaAltimetria

# Lista expandida com toda a mancha crítica de Lajeado
NOMES_EXPANDIDOS = [
    # Centro e transversais da Júlio
    'Júlio de Castilhos',
    'Coronel Júlio May',
    'Borges de Medeiros',
    'Silva Jardim',
    'Santos Filho',
    'Coronel Francisco Oscar Karnal',
    'Saldanha Marinho',
    'João Abott',
    'Alberto Torres',
    'Bento Gonçalves',
    'Tiradentes',
    'Pinheiro Machado',
    'Benjamin Constant',
    'Marechal Deodoro',
    'Oswaldo Aranha',
    'Carlos Von Koseritz',
    'Fialho de Vargas',
    'João Pessoa',

    # Eixo Parque dos Dick / Décio Martins Costa / Valão
    'Décio Martins Costa',
    'Capitão Leopoldo Heineck',
    'Major Amélio',
    'Rodolfo Germano Hexsel',
    'Jacob Scheid Sobrinho',
    'Erwino Heemann',

    # Moinhos e baixadas
    'Carlos Spohr Filho',
    'Padre Theodoro Amstad',
    'Santos Dumont',
    'Irmão Emílio Conrado',
    'João Schmatz',
    'Pedro Kolling',
    'Sete de Setembro',

    # Hidráulica, Floresta e margem do Rio Taquari
    'Bento Rosa',
    'Ítalo Reali',
    'Lothar Felipe Christ',
    '17 de Dezembro',
    'Alberto Pasqualini',
    'Ney Santos Arruda',

    # Conservas e acessos
    'Oswaldo Mathias Ely',
    'Pedro Petry',
    'Leopoldo Aloísio Heck'
]

def buscar_elevacoes_batch(pontos):
    """
    Consulta o modelo digital de elevação SRTM/Copernicus em lotes de até 50 pontos.
    """
    if not pontos:
        return []

    todas_elevacoes = []
    chunk_size = 50

    for i in range(0, len(pontos), chunk_size):
        chunk = pontos[i:i + chunk_size]
        lats = [str(p[0]) for p in chunk]
        lons = [str(p[1]) for p in chunk]

        url = f"https://api.open-meteo.com/v1/elevation?latitude={','.join(lats)}&longitude={','.join(lons)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'FloodWay/1.0'})

        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                data = json.loads(res.read().decode('utf-8'))
                elevacoes = data.get('elevation', [])
                todas_elevacoes.extend(elevacoes)
        except Exception as e:
            print(f"  [!] Erro no lote {i}-{i+chunk_size}: {e}")
            # Em caso de falha transitória, preenche com None para não desalinhar
            todas_elevacoes.extend([None] * len(chunk))
        
        time.sleep(0.2)

    return todas_elevacoes

def calibrar_ruas_expandido():
    print("=" * 65)
    print("CALIBRAGEM TOPOGRÁFICA EXPANDIDA — LAJEADO (SRTM / COPERNICUS DEM)")
    print("=" * 65)

    total_ruas = 0
    total_trechos = 0

    for termo in NOMES_EXPANDIDOS:
        ruas = RuaAltimetria.objects.filter(nome__icontains=termo)
        if not ruas.exists():
            continue

        for r in ruas:
            if not r.coordenadas_json:
                continue

            pontos_amostra = []
            for t in r.coordenadas_json:
                coords = t.get('coords', [])
                if coords:
                    mid_idx = len(coords) // 2
                    pontos_amostra.append(coords[mid_idx])
                else:
                    pontos_amostra.append(None)

            pontos_validos = [p for p in pontos_amostra if p]
            if not pontos_validos:
                continue

            elevacoes = buscar_elevacoes_batch(pontos_validos)
            if not elevacoes or len(elevacoes) != len(pontos_validos):
                print(f"[-] Divergência de elevações em {r.nome}")
                continue

            idx_elev = 0
            novos_trechos = []
            todas_cotas = []

            for t in r.coordenadas_json:
                coords = t.get('coords', [])
                if coords and elevacoes[idx_elev] is not None:
                    cota_real = round(float(elevacoes[idx_elev]), 1)
                    idx_elev += 1
                else:
                    cota_real = t.get('cota', r.cota_bloqueio)
                    if coords:
                        idx_elev += 1

                todas_cotas.append(cota_real)
                novos_trechos.append({
                    'cota': cota_real,
                    'coords': coords,
                    'calibrado_asfalto': True  # Pinta em azul no frontend quando seca
                })

            r.coordenadas_json = novos_trechos
            r.altitude_min = min(todas_cotas)
            r.altitude_max = max(todas_cotas)
            r.cota_bloqueio = min(todas_cotas)
            r.save()

            total_ruas += 1
            total_trechos += len(novos_trechos)
            print(f"[OK] {r.nome} (id {r.id}): {len(novos_trechos)} trechos calibrados [{min(todas_cotas)}m ~ {max(todas_cotas)}m]")

    print("\n" + "=" * 65)
    print(f"CONCLUÍDO: {total_ruas} ruas e {total_trechos} trechos calibrados com precisão!")
    print("=" * 65)

if __name__ == '__main__':
    calibrar_ruas_expandido()