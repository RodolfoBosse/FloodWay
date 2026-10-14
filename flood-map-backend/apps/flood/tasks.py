import re
import logging
import requests
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from apps.flood.models import CotaAtual, RuaAltimetria, PerfilSentinela, RotaSalva, HistoricoRuaAlagada
import json

logger = logging.getLogger(__name__)

def verificar_alertas_sentinela(nivel_rio, velocidade_cm_h):
    """
    Varre todos os perfis cadastrados e rotas para identificar
    quais estão em zona de atenção ou risco iminente.
    """
    alertas_gerados = []
    
    # 1. Checa residências
    perfis = PerfilSentinela.objects.filter(alerta_ativo=True)
    for p in perfis:
        margem = p.cota_terreno - nivel_rio
        if margem <= 0:
            alerta = {
                'tipo': 'evacuacao',
                'destinatario': p.email,
                'nome': p.nome,
                'endereco': p.endereco_completo,
                'mensagem': f"🚨 URGENTE: O Rio Taquari atingiu {nivel_rio:.2f}m e alcançou a cota da sua residência ({p.cota_terreno}m)!"
            }
            alertas_gerados.append(alerta)
        elif margem <= p.margem_aviso_metros:
            tempo_str = ""
            if velocidade_cm_h > 0:
                horas = (margem * 100) / velocidade_cm_h
                tempo_str = f" Previsão de impacto em ~{int(horas)} horas no ritmo atual."
            
            alerta = {
                'tipo': 'atencao',
                'destinatario': p.email,
                'nome': p.nome,
                'endereco': p.endereco_completo,
                'mensagem': f"⚠️ ALERTA: Rio Taquari em {nivel_rio:.2f}m. Sua casa está a apenas {margem:.1f}m da lâmina d'água.{tempo_str}"
            }
            alertas_gerados.append(alerta)
            
    # 2. Checa rotas salvas
    rotas = RotaSalva.objects.all()
    for r in rotas:
        margem_rota = r.cota_corte - nivel_rio
        if margem_rota <= 0.5:
            alerta = {
                'tipo': 'rota_bloqueada',
                'destinatario': r.email_usuario,
                'rota': r.nome_identificador,
                'mensagem': f"⛔ ALERTA DE ROTA: Sua rota '{r.nome_identificador}' tem ponto crítico de corte em {r.cota_corte}m prestes a inundar!"
            }
            alertas_gerados.append(alerta)
            
    if alertas_gerados:
        logger.info(f"🔔 {len(alertas_gerados)} alertas gerados pelo motor do Sentinela!")
        
    return alertas_gerados

@shared_task(bind=True, max_retries=3)
def update_cota_lajeado(self):
    try:
        from apps.flood.views_api import obter_cota_sincronizada
        dados = obter_cota_sincronizada()
        nivel = dados.get('nivel', 13.39)
        velocidade = dados.get('velocidade_cm_h', 0.0)
        
        # Executa motor de alertas preventivos
        alertas = verificar_alertas_sentinela(nivel, velocidade)
        
        return {
            'sucesso': True,
            'nivel': nivel,
            'velocidade': velocidade,
            'alertas_emitidos': len(alertas)
        }
    except Exception as exc:
        logger.error(f"Erro em update_cota_lajeado: {exc}")
        return {'sucesso': False, 'erro': str(exc)}
