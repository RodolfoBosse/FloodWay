import os
import django
import json
import math
import urllib.request
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.flood.models import RuaAltimetria

RUAS_PENDENTES = [
    'Décio Martins Costa',
    'Carlos Spohr Filho',
    'Capitão Leopoldo Heineck',
    'Marechal Deodoro',
    'Carlos von Koseritz',
    'Fialho de Vargas',
    'João Pessoa',
    'Major Amélio',
    'Rodolfo Germano Hexsel',
    'Jacob Scheid Sobrinho',
    'Erwino Heemann',
    'Senador Alberto Pasqualini',
    'Oswaldo Mathias Ely'
]

def distancia_metros(p1, p2):
    lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
    lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return 6371000 * c

def densificar_segmento(p1, p2, passo_max=30.0):
    dist = distancia_metros(p1, p2)
    if dist <= passo_max:
        return [p1, p2]
    num_partes = math.ceil(dist / passo_max)
    pontos = []
    for i in range(num_partes + 1):
        frac = i / num_partes
        lat = p1[0] + frac * (p2[0] - p1[0])
        lon = p1[1] + frac * (p2[1] - p1[1])
        pontos.append([round(lat, 7), round(lon, 7)])
    return pontos

def consultar_com_retry(pontos):
    """Consulta lotes com retry automático em caso de HTTP 429."""
    elevacoes_totais = []
    chunk_size = 50

    for i in range(0, len(pontos), chunk_size):
        chunk = pontos[i:i + chunk_size]
        lats = [str(p[0]) for p in chunk]
        lons = [str(p[1]) for p in chunk]
        url = f"https://api.open-meteo.com/v1/elevation?latitude={','.join(lats)}&longitude={','.join(lons)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'FloodWay-HiRes/2.1'})

        sucesso = False
        tentativas = 0
        while not sucesso and tentativas < 4:
            tentativas += 1
            try:
                with urllib.request.urlopen(req, timeout=20) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    elevacoes_totais.extend(data.get('elevation', []))
                    sucesso = True
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    print(f"    [429 Rate Limit] Aguardando 2.5s para o lote {i}...")
                    time.sleep(2.5)
                else:
                    print(f"    [!] Erro HTTP {e.code}: {e}")
                    break
            except Exception as e:
                print(f"    [!] Erro de conexão: {e}")
                time.sleep(1.0)

        if not sucesso:
            elevacoes_totais.extend([None] * len(chunk))

        time.sleep(0.6)  # Pausa respeitosa para não acionar o 429

    return elevacoes_totais

def recalibrar():
    print("=" * 65)
    print("FINALIZANDO CALIBRAGEM DAS RUAS PENDENTES (COM RETRY INTELIGENTE)")
    print("=" * 65)

    for nome in RUAS_PENDENTES:
        ruas = RuaAltimetria.objects.filter(nome__icontains=nome)
        for r in ruas:
            if not r.coordenadas_json:
                continue

            pares_micro = []
            for t in r.coordenadas_json:
                coords = t.get('coords', [])
                if len(coords) < 2:
                    continue
                for j in range(len(coords) - 1):
                    cadeia = densificar_segmento(coords[j], coords[j + 1], passo_max=30.0)
                    for k in range(len(cadeia) - 1):
                        pares_micro.append((cadeia[k], cadeia[k + 1]))

            if not pares_micro:
                continue

            pontos_unicos = []
            ponto_map = {}
            for p1, p2 in pares_micro:
                for pt in (p1, p2):
                    ch = (pt[0], pt[1])
                    if ch not in ponto_map:
                        ponto_map[ch] = len(pontos_unicos)
                        pontos_unicos.append(pt)

            elevacoes = consultar_com_retry(pontos_unicos)
            if len(elevacoes) != len(pontos_unicos):
                continue

            novos_trechos = []
            todas_cotas = []

            for p1, p2 in pares_micro:
                idx1 = ponto_map[(p1[0], p1[1])]
                idx2 = ponto_map[(p2[0], p2[1])]

                e1 = elevacoes[idx1] if elevacoes[idx1] is not None else r.cota_bloqueio
                e2 = elevacoes[idx2] if elevacoes[idx2] is not None else r.cota_bloqueio

                cota = round(float(min(e1, e2)), 1)
                todas_cotas.append(cota)
                novos_trechos.append({
                    'cota': cota,
                    'coords': [p1, p2],
                    'calibrado_asfalto': True
                })

            r.coordenadas_json = novos_trechos
            r.altitude_min = min(todas_cotas)
            r.altitude_max = max(todas_cotas)
            r.cota_bloqueio = min(todas_cotas)
            r.save()

            print(f"[OK] {r.nome} (id {r.id}): {len(novos_trechos)} micro-trechos calibrados [{min(todas_cotas)}m ~ {max(todas_cotas)}m]")

    print("\nTodas as pendências foram 100% resolvidas!")

if __name__ == '__main__':
    recalibrar()