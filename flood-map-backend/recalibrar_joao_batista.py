# recalibrar_joao_batista.py
import os
import django
import json
import urllib.request
import urllib.parse
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.flood.models import RuaAltimetria

def consultar_elevacoes(coords):
    lats = [f"{c[0]:.6f}" for c in coords]
    lons = [f"{c[1]:.6f}" for c in coords]
    url = f"https://api.open-meteo.com/v1/elevation?latitude={','.join(lats)}&longitude={','.join(lons)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'FloodMapCalibration/1.0'})
    for tentativa in range(4):
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                data = json.loads(res.read().decode())
                return data.get('elevation', [])
        except Exception as e:
            if '429' in str(e):
                time.sleep(2.0 * (tentativa + 1))
            else:
                time.sleep(1.0)
    return None

def recalibrar_ruas():
    # Inclui a João Batista de Mello e outras transversais do miolo do Centro
    nomes = ['João Batista de Mello', 'Bento Martins', 'Barão do Triunfo']
    ruas = RuaAltimetria.objects.filter(nome__iregex='|'.join(nomes))
    
    for r in ruas:
        if not r.coordenadas_json:
            continue
        
        # Coleta os pontos da geometria original
        todos_pontos = []
        for t in r.coordenadas_json:
            coords = t.get('coords', [])
            if coords:
                todos_pontos.extend(coords)
        
        if not todos_pontos:
            continue
            
        elevs = consultar_elevacoes(todos_pontos)
        if not elevs:
            print(f"Falha ao consultar {r.nome}")
            continue
            
        novos_trechos = []
        for i in range(len(todos_pontos) - 1):
            p1, p2 = todos_pontos[i], todos_pontos[i+1]
            cota = round(min(elevs[i], elevs[i+1]), 1)
            novos_trechos.append({
                'cota': cota,
                'coords': [p1, p2],
                'calibrado_asfalto': True
            })
            
        cotas = [t['cota'] for t in novos_trechos]
        r.coordenadas_json = novos_trechos
        r.altitude_min = min(cotas)
        r.altitude_max = max(cotas)
        r.calibrado_asfalto = True
        r.save()
        print(f"[OK] {r.nome} calibrada com {len(novos_trechos)} micro-trechos [{r.altitude_min}m ~ {r.altitude_max}m]!")

if __name__ == '__main__':
    recalibrar_ruas()