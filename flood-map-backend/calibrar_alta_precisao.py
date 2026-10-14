import os
import django
import json
import math
import urllib.request
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.flood.models import RuaAltimetria

NOMES_EXPANDIDOS = [
    # Centro e transversais da Júlio de Castilhos
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

    # Hidráulica, Floresta e margem do Taquari
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

def distancia_metros(p1, p2):
    """Calcula a distância aproximada em metros entre dois pontos [lat, lon]."""
    lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
    lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return 6371000 * c

def densificar_segmento(p1, p2, passo_max=30.0):
    """
    Subdivide um segmento de rua a cada ~25-30m (resolução de 1 pixel de satélite).
    """
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

def consultar_satelite_batch(pontos):
    """
    Consulta o satélite Copernicus / SRTM via API Open-Meteo em lotes de 80 coordenadas.
    """
    elevacoes_totais = []
    chunk_size = 80

    for i in range(0, len(pontos), chunk_size):
        chunk = pontos[i:i + chunk_size]
        lats = [str(p[0]) for p in chunk]
        lons = [str(p[1]) for p in chunk]

        url = f"https://api.open-meteo.com/v1/elevation?latitude={','.join(lats)}&longitude={','.join(lons)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'FloodWay-HiRes/2.0'})

        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                data = json.loads(res.read().decode('utf-8'))
                elevacoes_totais.extend(data.get('elevation', []))
        except Exception as e:
            print(f"  [!] Falha ao consultar lote: {e}")
            elevacoes_totais.extend([None] * len(chunk))
        
        time.sleep(0.15)

    return elevacoes_totais

def calibrar_super_precisao():
    print("=" * 70)
    print("INICIANDO CALIBRAGEM DE HIPERPRECISÃO TOPOGRÁFICA (SATÉLITE 30M)")
    print("=" * 70)

    total_ruas = 0
    total_microtrechos = 0

    for termo in NOMES_EXPANDIDOS:
        ruas = RuaAltimetria.objects.filter(nome__icontains=termo)
        if not ruas.exists():
            continue

        for r in ruas:
            if not r.coordenadas_json:
                continue

            # 1. Quebra todos os trechos existentes em micro-segmentos de alta resolução
            pares_micro = []
            for t in r.coordenadas_json:
                coords = t.get('coords', [])
                if len(coords) < 2:
                    continue

                for j in range(len(coords) - 1):
                    p1 = coords[j]
                    p2 = coords[j + 1]
                    cadeia = densificar_segmento(p1, p2, passo_max=30.0)
                    for k in range(len(cadeia) - 1):
                        pares_micro.append((cadeia[k], cadeia[k + 1]))

            if not pares_micro:
                continue

            # 2. Reúne pontos únicos para consultar a elevação de satélite
            pontos_unicos = []
            ponto_map = {}
            for p1, p2 in pares_micro:
                for pt in (p1, p2):
                    chave = (pt[0], pt[1])
                    if chave not in ponto_map:
                        ponto_map[chave] = len(pontos_unicos)
                        pontos_unicos.append(pt)

            elevacoes = consultar_satelite_batch(pontos_unicos)
            if len(elevacoes) != len(pontos_unicos):
                print(f"[-] Erro na amostragem de {r.nome}")
                continue

            # 3. Monta os micro-trechos finais com a cota crítica de cada um
            novos_trechos = []
            todas_cotas = []

            for p1, p2 in pares_micro:
                idx1 = ponto_map[(p1[0], p1[1])]
                idx2 = ponto_map[(p2[0], p2[1])]

                e1 = elevacoes[idx1] if elevacoes[idx1] is not None else r.cota_bloqueio
                e2 = elevacoes[idx2] if elevacoes[idx2] is not None else r.cota_bloqueio

                # Ponto de corte do asfalto = menor cota do micro-trecho
                cota_trecho = round(float(min(e1, e2)), 1)
                todas_cotas.append(cota_trecho)

                novos_trechos.append({
                    'cota': cota_trecho,
                    'coords': [p1, p2],
                    'calibrado_asfalto': True  # Renderiza em azul (#0284c7)
                })

            # Atualiza o registro no banco de dados
            r.coordenadas_json = novos_trechos
            r.altitude_min = min(todas_cotas)
            r.altitude_max = max(todas_cotas)
            r.cota_bloqueio = min(todas_cotas)
            r.save()

            total_ruas += 1
            total_microtrechos += len(novos_trechos)
            print(f"[OK] {r.nome} (id {r.id}): {len(novos_trechos)} micro-trechos calibrados! [{min(todas_cotas)}m ~ {max(todas_cotas)}m]")

    print("\n" + "=" * 70)
    print(f"SUCESSO TOTAL: {total_ruas} ruas processadas com {total_microtrechos} micro-cotas de satélite!")
    print("=" * 70)

if __name__ == '__main__':
    calibrar_super_precisao()