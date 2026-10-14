import re
import logging
import requests
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import json

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def update_cota_lajeado(self):
    """
    Task Celery que executa a cada 15 minutos:
    1. Scraping da cota em nivelguaiba.com.br
    2. Salva no banco de dados
    3. Atualiza status de ruas bloqueadas
    4. Envia notificação via WebSocket (quando implementado)
    """
    try:
        logger.info("Iniciando update de cota para Lajeado...")
        
        # 1. Fazer request ao site
        url = 'https://nivelguaiba.com.br/lajeado'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        html = response.text
        
        # 2. Extrair cota do JSON-LD embedded (Observation schema)
        pattern = r'"@type":"Observation"[^}]*?"value":(\d+\.\d+)'
        match = re.search(pattern, html)
        
        if not match:
            logger.error(f"Não foi possível extrair cota do HTML")
            raise ValueError("Padrão de cota não encontrado")
        
        cota = float(match.group(1))
        logger.info(f"Cota extraída com sucesso: {cota}m")
        
        # 3. Salvar/atualizar no banco
        from apps.flood.models import CotaAtual, RuaAltimetria
        
        cota_obj, created = CotaAtual.objects.update_or_create(
            cidade='lajeado',
            defaults={
                'nivel': cota,
                'fonte': 'nivelguaiba',
                'timestamp': timezone.now()
            }
        )
        
        acao = "Criado" if created else "Atualizado"
        logger.info(f"{acao} registro de cota: {cota_obj}")
        
        # 4. Calcular ruas afetadas
        ruas_bloqueadas = calcular_ruas_afetadas('lajeado', cota)
        total_ruas = RuaAltimetria.objects.filter(
            cidade='lajeado',
            ativa=True
        ).count()
        
        if total_ruas > 0:
            percentual = (len(ruas_bloqueadas) / total_ruas) * 100
        else:
            percentual = 0
        
        logger.info(
            f"Ruas bloqueadas: {len(ruas_bloqueadas)}/{total_ruas} ({percentual:.1f}%)"
        )
        
        # 5. Notificar via WebSocket (quando implementado)
        # broadcast_websocket({
        #     'tipo': 'update_cota',
        #     'cota': cota,
        #     'status': cota_obj.status,
        #     'ruas_bloqueadas': [r.id for r in ruas_bloqueadas],
        #     'timestamp': timezone.now().isoformat()
        # })
        
        return {
            'sucesso': True,
            'cota': cota,
            'status': cota_obj.status,
            'ruas_bloqueadas': len(ruas_bloqueadas),
            'total_ruas': total_ruas,
            'percentual_bloqueado': percentual
        }
    
    except requests.RequestException as exc:
        logger.error(f"Erro ao fazer request: {exc}")
        raise self.retry(exc=exc, countdown=60)  # Retry em 60 segundos
    
    except Exception as exc:
        logger.error(f"Erro inesperado em update_cota_lajeado: {exc}", exc_info=True)
        raise self.retry(exc=exc, countdown=300)  # Retry em 5 minutos


@shared_task
def calcular_ruas_afetadas(cidade, cota_atual):
    """
    Calcula quais ruas estão bloqueadas para uma cota específica
    """
    from apps.flood.models import RuaAltimetria
    
    ruas = RuaAltimetria.objects.filter(
        cidade=cidade,
        ativa=True
    )
    
    ruas_bloqueadas = [r for r in ruas if r.is_bloqueada(cota_atual)]
    
    return ruas_bloqueadas


@shared_task
def limpar_historico_antigo():
    """
    Remove registros de histórico com mais de 90 dias
    """
    from apps.flood.models import HistoricoRuaAlagada
    
    data_limite = timezone.now() - timedelta(days=90)
    
    deletados, _ = HistoricoRuaAlagada.objects.filter(
        timestamp_bloqueio__lt=data_limite
    ).delete()
    
    logger.info(f"Limpeza de histórico: {deletados} registros removidos")
    
    return {'deletados': deletados}


@shared_task
def gerar_relatorio_diario():
    """
    Gera relatório diário de alagamentos
    """
    from apps.flood.models import CotaAtual, HistoricoRuaAlagada
    from django.db.models import Max, Min, Avg
    
    hoje = timezone.now().date()
    
    # Cotas do dia
    cotas = CotaAtual.objects.filter(
        cidade='lajeado',
        timestamp__date=hoje
    )
    
    if not cotas.exists():
        logger.warning("Nenhuma cota encontrada para hoje")
        return {'sucesso': False}
    
    stats = cotas.aggregate(
        cota_min=Min('nivel'),
        cota_max=Max('nivel'),
        cota_media=Avg('nivel')
    )
    
    # Ruas alagadas hoje
    ruas_alagadas_hoje = HistoricoRuaAlagada.objects.filter(
        timestamp_bloqueio__date=hoje
    ).count()
    
    relatorio = {
        'data': hoje.isoformat(),
        'cota_minima': stats['cota_min'],
        'cota_maxima': stats['cota_max'],
        'cota_media': round(stats['cota_media'], 2),
        'total_alagamentos': ruas_alagadas_hoje,
        'total_observacoes': cotas.count()
    }
    
    logger.info(f"Relatório diário gerado: {json.dumps(relatorio, indent=2)}")
    
    return relatorio


@shared_task
def sincronizar_ruas_geomais():
    """
    Sincroniza ruas do Geomais quando essa feature for implementada
    
    Próximas etapas:
    - Autenticar no Geomais
    - Chamar API /source/toponimia/169/
    - Extrair nomes de ruas
    - Extrair altimetrias dos mapas digitalizados
    - Atualizar banco de dados
    """
    logger.info("Task de sincronização Geomais - ainda não implementada")
    
    # TODO: Implementar quando altimetrias reais estiverem disponíveis
    
    return {'status': 'pendente'}
