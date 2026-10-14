# -*- coding: utf-8 -*-
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.flood.models import RuaAltimetria

ruas = RuaAltimetria.objects.filter(nome__iregex=r'(Borges de Medeiros|Alberto Torres|Bento|Saldanha Marinho|Julio de Castilhos|Benjamin Constant)')
print('=' * 65)
print('STATUS DAS COTAS DO CORREDOR SEGURO NO CENTRO:')
print('=' * 65)
for r in ruas:
    cotas = [t.get('cota') for t in (r.coordenadas_json or []) if isinstance(t, dict) and 'cota' in t]
    if cotas:
        print(f'{r.nome} (id {r.id}):')
        print(f'   Cotas: de {min(cotas):.1f}m ate {max(cotas):.1f}m ({len(cotas)} trechos calibrados)')
    else:
        print(f'{r.nome} (id {r.id}): cota base={getattr(r, "cota_bloqueio", 0)}m (sem micro-trechos)')

mb_lat, mb_lon = -29.46738, -51.96263
print('\n' + '=' * 65)
print('RUAS IMEDIATAMENTE COLADAS NO COLEGIO MADRE BARBARA:')
print('=' * 65)
for r in ruas:
    for t in (r.coordenadas_json or []):
        if isinstance(t, dict) and 'coords' in t:
            for c in t['coords']:
                dist_m = int((((c[0] - mb_lat)**2 + (c[1] - mb_lon)**2)**0.5) * 111000)
                if dist_m < 120:
                    print(f'-> {r.nome} a {dist_m}m da porta: cota {t.get("cota")}m')
                    break
