import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.utils import timezone
from django.db.models import Q, Count, Min, Max, Avg
from datetime import timedelta

logger = logging.getLogger(__name__)


class CotaAtualView(APIView):
    """
    GET /api/v1/cota/lajeado/
    Retorna o nível atual do rio e status
    """
    permission_classes = [AllowAny]
    
    def get(self, request, cidade='lajeado'):
        from apps.flood.models import CotaAtual
        from apps.flood.serializers import CotaAtualSerializer
        
        try:
            cota = CotaAtual.objects.filter(cidade=cidade).latest('timestamp')
        except CotaAtual.DoesNotExist:
            return Response(
                {'erro': f'Nenhuma cota encontrada para {cidade}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CotaAtualSerializer(cota)
        return Response(serializer.data)


class RuasAfetadasView(APIView):
    """
    GET /api/v1/ruas/afetadas/?cidade=lajeado&cota=14.21
    Retorna lista de ruas bloqueadas para uma cota específica
    
    Se cota não for informada, usa a cota atual
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        from apps.flood.models import CotaAtual, RuaAltimetria
        from apps.flood.serializers import RuaAltimetriaSerializer
        
        cidade = request.query_params.get('cidade', 'lajeado')
        cota_param = request.query_params.get('cota')
        
        # Se cota não foi informada, usar a atual
        if cota_param:
            try:
                cota_atual = float(cota_param)
            except ValueError:
                return Response(
                    {'erro': 'Cota deve ser um número'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            try:
                cota_obj = CotaAtual.objects.filter(cidade=cidade).latest('timestamp')
                cota_atual = cota_obj.nivel
            except CotaAtual.DoesNotExist:
                return Response(
                    {'erro': f'Nenhuma cota encontrada para {cidade}'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Buscar ruas afetadas
        ruas = RuaAltimetria.objects.filter(
            cidade=cidade,
            ativa=True,
            cota_bloqueio__lte=cota_atual
        ).order_by('nome')
        
        ruas_bloqueadas = RuaAltimetriaSerializer(
            ruas,
            many=True,
            context={'cota_atual': cota_atual}
        )
        
        # Calcular estatísticas
        total_ruas = RuaAltimetria.objects.filter(
            cidade=cidade,
            ativa=True
        ).count()
        
        percentual = (ruas.count() / total_ruas * 100) if total_ruas > 0 else 0
        
        return Response({
            'cidade': cidade,
            'cota_atual': cota_atual,
            'ruas_bloqueadas': ruas_bloqueadas.data,
            'total_bloqueadas': ruas.count(),
            'total_ruas': total_ruas,
            'percentual_bloqueado': round(percentual, 2)
        })


class RuasView(APIView):
    """
    GET /api/v1/ruas/?cidade=lajeado
    Retorna todas as ruas cadastradas
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        from apps.flood.models import RuaAltimetria, CotaAtual
        from apps.flood.serializers import RuaAltimetriaSerializer
        
        cidade = request.query_params.get('cidade', 'lajeado')
        
        # Tentar pegar cota atual para marcar ruas bloqueadas
        try:
            cota_obj = CotaAtual.objects.filter(cidade=cidade).latest('timestamp')
            cota_atual = cota_obj.nivel
        except CotaAtual.DoesNotExist:
            cota_atual = None
        
        ruas = RuaAltimetria.objects.filter(
            cidade=cidade,
            ativa=True
        ).order_by('nome')
        
        serializer = RuaAltimetriaSerializer(
            ruas,
            many=True,
            context={'cota_atual': cota_atual}
        )
        
        return Response({
            'cidade': cidade,
            'cota_atual': cota_atual,
            'ruas': serializer.data,
            'total': ruas.count()
        })


class MapaStatusView(APIView):
    """
    GET /api/v1/mapa/status/?cidade=lajeado
    Retorna status completo: cota + ruas + configuração
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        from apps.flood.models import CotaAtual, RuaAltimetria
        from apps.flood.serializers import MapaStatusSerializer
        
        cidade = request.query_params.get('cidade', 'lajeado')
        
        try:
            cota_obj = CotaAtual.objects.filter(cidade=cidade).latest('timestamp')
        except CotaAtual.DoesNotExist:
            return Response(
                {'erro': f'Nenhuma cota encontrada para {cidade}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = {
            'cota_atual': cota_obj,
        }
        
        serializer = MapaStatusSerializer(data)
        return Response(serializer.data)


class HistoricoView(APIView):
    """
    GET /api/v1/historico/alagamentos/?cidade=lajeado&dias=7
    Retorna histórico de alagamentos dos últimos N dias
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        from apps.flood.models import HistoricoRuaAlagada
        from apps.flood.serializers import HistoricoAlagamentoSerializer
        
        cidade = request.query_params.get('cidade', 'lajeado')
        dias = int(request.query_params.get('dias', 7))
        
        data_limite = timezone.now() - timedelta(days=dias)
        
        historico = HistoricoRuaAlagada.objects.filter(
            rua__cidade=cidade,
            timestamp_bloqueio__gte=data_limite
        ).order_by('-timestamp_bloqueio')
        
        serializer = HistoricoAlagamentoSerializer(
            historico,
            many=True
        )
        
        # Estatísticas
        stats = historico.aggregate(
            total_eventos=Count('id'),
            duracao_total=Avg('duracao_minutos')
        )
        
        return Response({
            'cidade': cidade,
            'periodo_dias': dias,
            'data_limite': data_limite.isoformat(),
            'historico': serializer.data,
            'total_eventos': stats['total_eventos'],
            'duracao_media_minutos': round(stats['duracao_total'], 2) if stats['duracao_total'] else None
        })


class RelatorioDiarioView(APIView):
    """
    GET /api/v1/relatorio/diario/?cidade=lajeado&data=2026-09-29
    Retorna relatório diário de cotas e alagamentos
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        from apps.flood.models import CotaAtual, HistoricoRuaAlagada
        from datetime import date
        
        cidade = request.query_params.get('cidade', 'lajeado')
        data_str = request.query_params.get('data')
        
        # Se não informar data, usa hoje
        if data_str:
            try:
                data = date.fromisoformat(data_str)
            except ValueError:
                return Response(
                    {'erro': 'Data deve estar em formato YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            data = timezone.now().date()
        
        # Cotas do dia
        cotas = CotaAtual.objects.filter(
            cidade=cidade,
            timestamp__date=data
        )
        
        if not cotas.exists():
            return Response(
                {'erro': f'Nenhuma cota encontrada para {data}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        stats_cotas = cotas.aggregate(
            cota_min=Min('nivel'),
            cota_max=Max('nivel'),
            cota_media=Avg('nivel')
        )
        
        # Alagamentos do dia
        alagamentos = HistoricoRuaAlagada.objects.filter(
            rua__cidade=cidade,
            timestamp_bloqueio__date=data
        )
        
        stats_alagamentos = alagamentos.aggregate(
            total=Count('id'),
            duracao_media=Avg('duracao_minutos')
        )
        
        # Ruas mais afetadas
        ruas_mais_afetadas = alagamentos.values('rua__nome').annotate(
            total=Count('id')
        ).order_by('-total')[:5]
        
        return Response({
            'data': data.isoformat(),
            'cidade': cidade,
            'cotas': {
                'minima': round(stats_cotas['cota_min'], 2),
                'maxima': round(stats_cotas['cota_max'], 2),
                'media': round(stats_cotas['cota_media'], 2),
                'total_observacoes': cotas.count()
            },
            'alagamentos': {
                'total_eventos': stats_alagamentos['total'],
                'duracao_media_minutos': round(stats_alagamentos['duracao_media'], 2) if stats_alagamentos['duracao_media'] else None
            },
            'ruas_mais_afetadas': list(ruas_mais_afetadas)
        })


class CotasTimeseriesView(APIView):
    """
    GET /api/v1/cotas/timeseries/?cidade=lajeado&dias=30
    Retorna série temporal de cotas para gráficos
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        from apps.flood.models import CotaAtual
        
        cidade = request.query_params.get('cidade', 'lajeado')
        dias = int(request.query_params.get('dias', 30))
        
        data_limite = timezone.now() - timedelta(days=dias)
        
        cotas = CotaAtual.objects.filter(
            cidade=cidade,
            timestamp__gte=data_limite
        ).order_by('timestamp').values('timestamp', 'nivel', 'status')
        
        # Converter para lista simples para melhor performance
        dados = list(cotas)
        
        return Response({
            'cidade': cidade,
            'periodo_dias': dias,
            'data_inicio': data_limite.isoformat(),
            'data_fim': timezone.now().isoformat(),
            'cotas': dados,
            'total_pontos': len(dados)
        })
