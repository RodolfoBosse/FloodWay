import re
import requests
import logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.flood.models import CotaAtual, RuaAltimetria
from apps.flood.serializers import MapaStatusSerializer, CotaAtualSerializer

logger = logging.getLogger(__name__)

def obter_cota_tempo_real():
    """Busca a cota oficial ao vivo no nivelguaiba.com.br/lajeado"""
    url = 'https://nivelguaiba.com.br/lajeado'
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        res = requests.get(url, headers=headers, timeout=8)
        if res.status_code == 200:
            html = res.text
            # Padrão 1: JSON-LD Observation
            m1 = re.search(r'"@type":"Observation"[^}]*?"value":(\d+\.?\d*)', html)
            if m1:
                return float(m1.group(1))

            # Padrão 2: Primeiro valor de metros em destaque (ex: 13.84m)
            m2 = re.findall(r'(\d{1,2}[,\.]\d{2})\s*m', html)
            if m2:
                # Converte vírgula para ponto se necessário
                val = float(m2[0].replace(',', '.'))
                # Sanity check: cota do Taquari em Lajeado varia entre 12m e 34m
                if 10.0 <= val <= 35.0:
                    return val
    except Exception as e:
        logger.error(f"Erro ao buscar cota tempo real: {e}")
    return None

class AtualizarCotaView(APIView):
    """Endpoint chamado para sincronizar o nível do rio em tempo real"""
    def post(self, request):
        cota_ao_vivo = obter_cota_tempo_real()
        if cota_ao_vivo:
            cota_obj, _ = CotaAtual.objects.update_or_create(
                cidade='lajeado',
                defaults={
                    'nivel': cota_ao_vivo,
                    'fonte': 'nivelguaiba.com.br',
                    'timestamp': timezone.now()
                }
            )
            return Response({
                'sucesso': True,
                'nivel': cota_ao_vivo,
                'timestamp': cota_obj.timestamp,
                'fonte': 'nivelguaiba.com.br'
            })
        return Response({'sucesso': False, 'mensagem': 'Não foi possível ler a cota agora'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MapaStatusView(APIView):
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado').lower()
        
        # Auto-refresh: se a cota tiver mais de 15 minutos, busca nova cota ao vivo
        cota_atual = CotaAtual.objects.filter(cidade=cidade).order_by('-timestamp').first()
        agora = timezone.now()
        
        if not cota_atual or (agora - cota_atual.timestamp).total_seconds() > 900:
            novo_nivel = obter_cota_tempo_real()
            if novo_nivel:
                cota_atual, _ = CotaAtual.objects.update_or_create(
                    cidade=cidade,
                    defaults={'nivel': novo_nivel, 'fonte': 'nivelguaiba.com.br', 'timestamp': agora}
                )

        if not cota_atual:
            cota_atual = CotaAtual.objects.create(
                cidade=cidade,
                nivel=13.84,
                fonte='estimada',
                timestamp=agora
            )

        dados = {
            'cota_atual': cota_atual,
            'ruas': [],
            'config': {}
        }
        
        serializer = MapaStatusSerializer(dados)
        return Response(serializer.data)
import json
import re
import requests
from django.http import JsonResponse
from django.utils import timezone
from apps.flood.models import CotaAtual, RuaAltimetria, PerfilSentinela, RotaSalva
from django.views.decorators.csrf import csrf_exempt

def coletar_cota_nivelguaiba():
    try:
        url = "https://nivelguaiba.com.br/lajeado"
        resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}, timeout=8)
        if resp.status_code == 200:
            matches = re.findall(r'(\d{1,2}[,\.]\d{2})\s*m', resp.text)
            nivel = float(matches[0].replace(',', '.')) if matches else None
            
            # Extrai tendência oficial e velocidade em cm/h
            m_vel = re.search(r'(Subindo|Descendo|Est[aá]vel)\s+a\s+(\d+[,\.]\d+)\s*cm\/hora', resp.text, re.IGNORECASE)
            tendencia = m_vel.group(1).title() if m_vel else 'Estável'
            vel_num = float(m_vel.group(2).replace(',', '.')) if m_vel else 0.0
            
            icone = '▲' if tendencia == 'Subindo' else ('▼' if tendencia == 'Descendo' else '⏸')
            velocidade_formatada = f"{icone} {tendencia} a {vel_num:.1f} cm/h"
            
            return {
                'nivel': nivel,
                'tendencia': tendencia,
                'velocidade_cm_h': -vel_num if tendencia == 'Descendo' else vel_num,
                'velocidade_formatada': velocidade_formatada
            }
    except Exception as e:
        print(f"Erro no coletor NivelGuaiba: {e}")
    return None

DADOS_CACHE_COTA = {
    'nivel': 13.39,
    'tendencia': 'Descendo',
    'velocidade_cm_h': -5.3,
    'velocidade_formatada': '▼ Descendo a 5,3 cm/h',
    'timestamp': timezone.now()
}

def obter_cota_sincronizada():
    global DADOS_CACHE_COTA
    agora = timezone.now()
    
    # Atualiza se passou de 10 minutos
    if (agora - DADOS_CACHE_COTA['timestamp']).total_seconds() > 600:
        dados = coletar_cota_nivelguaiba()
        if dados and dados.get('nivel'):
            DADOS_CACHE_COTA = {
                'nivel': dados['nivel'],
                'tendencia': dados['tendencia'],
                'velocidade_cm_h': dados['velocidade_cm_h'],
                'velocidade_formatada': dados['velocidade_formatada'],
                'timestamp': agora
            }
            # Grava no banco
            cota, _ = CotaAtual.objects.get_or_create(cidade='lajeado', defaults={'nivel': dados['nivel']})
            cota.nivel = dados['nivel']
            cota.save()
            print(f"🌊 [Auto-Sync] Cota: {dados['nivel']}m | {dados['velocidade_formatada']}")
            
    return DADOS_CACHE_COTA

def api_cota_atual(request):
    dados = obter_cota_sincronizada()
    return JsonResponse({
        'cidade': 'lajeado',
        'cota_atual': dados['nivel'],
        'nivel': dados['nivel'],
        'tendencia': dados['tendencia'],
        'velocidade_cm_h': dados['velocidade_cm_h'],
        'velocidade_formatada': dados['velocidade_formatada'],
        'timestamp': dados['timestamp'].isoformat()
    })
