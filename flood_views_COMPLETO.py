from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import CotaAtual, RuaAltimetria, HistoricoRuaAlagada
from .serializers import CotaAtualSerializer, RuaAltimetriaSerializer


class CotaAtualView(APIView):
    """Retorna a cota atual do Rio Taquari em Lajeado"""
    
    def get(self, request, cidade='lajeado'):
        try:
            cota = CotaAtual.objects.filter(cidade=cidade).latest('timestamp')
            serializer = CotaAtualSerializer(cota)
            return Response(serializer.data)
        except CotaAtual.DoesNotExist:
            return Response(
                {'erro': f'Nenhuma cota encontrada para {cidade}'},
                status=status.HTTP_404_NOT_FOUND
            )


class RuasView(APIView):
    """Lista todas as ruas cadastradas"""
    
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado')
        ruas = RuaAltimetria.objects.filter(cidade=cidade, ativa=True)
        serializer = RuaAltimetriaSerializer(ruas, many=True)
        return Response({
            'total': ruas.count(),
            'ruas': serializer.data
        })


class RuasAfetadasView(APIView):
    """Lista apenas as ruas bloqueadas pela enchente"""
    
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado')
        try:
            cota = CotaAtual.objects.filter(cidade=cidade).latest('timestamp')
            ruas_afetadas = RuaAltimetria.objects.filter(
                cidade=cidade,
                altitude_min__lte=cota.nivel,
                ativa=True
            )
            serializer = RuaAltimetriaSerializer(ruas_afetadas, many=True)
            return Response({
                'cota_atual': cota.nivel,
                'status': cota.status,
                'total_afetadas': ruas_afetadas.count(),
                'ruas': serializer.data,
                'timestamp': cota.timestamp,
            })
        except CotaAtual.DoesNotExist:
            return Response(
                {'erro': 'Nenhuma cota encontrada', 'ruas': []},
                status=status.HTTP_404_NOT_FOUND
            )


class MapaStatusView(APIView):
    """Status geral do mapa (resumo)"""
    
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado')
        try:
            cota = CotaAtual.objects.filter(cidade=cidade).latest('timestamp')
            ruas = RuaAltimetria.objects.filter(cidade=cidade, ativa=True)
            ruas_afetadas = ruas.filter(altitude_min__lte=cota.nivel)
            
            return Response({
                'cota_atual': cota.nivel,
                'status': cota.status,
                'total_ruas': ruas.count(),
                'ruas_bloqueadas': ruas_afetadas.count(),
                'timestamp': cota.timestamp,
                'centro': {
                    'lat': -29.4669,
                    'lng': -51.9611
                }
            })
        except CotaAtual.DoesNotExist:
            return Response({
                'erro': 'Nenhuma cota encontrada',
                'total_ruas': RuaAltimetria.objects.filter(cidade=cidade).count(),
                'ruas_bloqueadas': 0,
                'centro': {
                    'lat': -29.4669,
                    'lng': -51.9611
                }
            })


class HistoricoView(APIView):
    """Histórico de alagamentos"""
    
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado')
        dias = int(request.query_params.get('dias', 7))
        
        data_inicio = timezone.now() - timedelta(days=dias)
        historico = HistoricoRuaAlagada.objects.filter(
            rua__cidade=cidade,
            timestamp_bloqueio__gte=data_inicio
        ).order_by('-timestamp_bloqueio')
        
        dados = []
        for item in historico:
            dados.append({
                'rua': item.rua.nome,
                'cota_inicio': item.cota_inicio,
                'timestamp_bloqueio': item.timestamp_bloqueio,
                'timestamp_reabertura': item.timestamp_reabertura,
                'duracao_minutos': item.duracao_minutos,
            })
        
        return Response({
            'cidade': cidade,
            'periodo_dias': dias,
            'total': len(dados),
            'historico': dados
        })


class RelatorioDiarioView(APIView):
    """Relatório diário de alagamentos"""
    
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado')
        data_str = request.query_params.get('data')
        
        if data_str:
            from datetime import datetime
            data = datetime.fromisoformat(data_str).date()
        else:
            from datetime import date
            data = date.today()
        
        historico = HistoricoRuaAlagada.objects.filter(
            rua__cidade=cidade,
            timestamp_bloqueio__date=data
        )
        
        return Response({
            'cidade': cidade,
            'data': data,
            'total_eventos': historico.count(),
            'ruas_afetadas': list(set([h.rua.nome for h in historico])),
        })


class CotasTimeseriesView(APIView):
    """Série temporal das cotas"""
    
    def get(self, request):
        cidade = request.query_params.get('cidade', 'lajeado')
        dias = int(request.query_params.get('dias', 30))
        
        data_inicio = timezone.now() - timedelta(days=dias)
        cotas = CotaAtual.objects.filter(
            cidade=cidade,
            timestamp__gte=data_inicio
        ).order_by('timestamp')
        
        dados = []
        for cota in cotas:
            dados.append({
                'timestamp': cota.timestamp,
                'nivel': cota.nivel,
                'status': cota.status,
            })
        
        return Response({
            'cidade': cidade,
            'periodo_dias': dias,
            'total_pontos': len(dados),
            'dados': dados,
            'cota_critica': 19.0,
            'cota_alerta': 17.5,
        })
