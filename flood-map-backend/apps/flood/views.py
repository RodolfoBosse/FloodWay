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
import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from apps.flood.models import PerfilSentinela

def obter_altitude_satelite(lat, lon):
    try:
        url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat},{lon}"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            dados = resp.json()
            if dados.get('results'):
                return float(dados['results'][0]['elevation'])
    except Exception:
        pass
    # Fallback seguro da cota média urbana de Lajeado
    return 22.0

@csrf_exempt
def salvar_perfil_sentinela(request):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        nome = data.get('nome', '')
        whatsapp = data.get('whatsapp', '')
        endereco = data.get('endereco_completo', '')
        bairro = data.get('bairro', '')
        lat = data.get('latitude')
        lon = data.get('longitude')
        
        if not email:
            return JsonResponse({'erro': 'Email é obrigatório'}, status=400)
            
        cota = 22.0
        if lat and lon:
            cota = obter_altitude_satelite(lat, lon)

        perfil, criado = PerfilSentinela.objects.update_or_create(
            email=email,
            defaults={
                'nome': nome,
                'whatsapp': whatsapp,
                'endereco_completo': endereco,
                'bairro': bairro,
                'latitude': lat,
                'longitude': lon,
                'cota_terreno': cota,
                'alerta_ativo': True
            }
        )
        
        return JsonResponse({
            'status': 'sucesso',
            'perfil': {
                'nome': perfil.nome,
                'email': perfil.email,
                'whatsapp': perfil.whatsapp,
                'endereco': perfil.endereco_completo,
                'bairro': perfil.bairro,
                'latitude': perfil.latitude,
                'longitude': perfil.longitude,
                'cota_terreno': round(perfil.cota_terreno, 1)
            }
        })
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)
import json
import re
import requests
from django.http import JsonResponse
from django.utils import timezone
from apps.flood.models import CotaAtual, RuaAltimetria

def coletar_cota_nivelguaiba():
    try:
        url = "https://nivelguaiba.com.br/lajeado"
        resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=8)
        if resp.status_code == 200:
            matches = re.findall(r'(\d{1,2}[,\.]\d{2})\s*m', resp.text)
            if matches:
                # O primeiro valor encontrado no topo da página é a cota do Rio Taquari
                return float(matches[0].replace(',', '.'))
    except Exception as e:
        print(f"Erro no coletor NivelGuaiba: {e}")
    return None

def obter_cota_sincronizada():
    cota = CotaAtual.objects.first()
    agora = timezone.now()
    
    # Se não existe ou tem mais de 15 minutos (900s), busca dado fresco
    precisa_atualizar = False
    if not cota:
        precisa_atualizar = True
    else:
        ts = getattr(cota, 'timestamp', None) or getattr(cota, 'data_hora', None)
        if ts and (agora - ts).total_seconds() > 900:
            precisa_atualizar = True

    if precisa_atualizar:
        novo_nivel = coletar_cota_nivelguaiba()
        if novo_nivel:
            if not cota:
                cota = CotaAtual.objects.create(nivel=novo_nivel)
            else:
                cota.nivel = novo_nivel
                if hasattr(cota, 'timestamp'):
                    cota.timestamp = agora
                elif hasattr(cota, 'data_hora'):
                    cota.data_hora = agora
                cota.save()
                print(f"🌊 [Auto-Sync] Cota atualizada automaticamente para {novo_nivel}m!")

    return cota.nivel if cota else 13.66

def api_cota_atual(request):
    nivel = obter_cota_sincronizada()
    cota = CotaAtual.objects.first()
    ts = getattr(cota, 'timestamp', None) or getattr(cota, 'data_hora', None)
    
    return JsonResponse({
        'cidade': 'lajeado',
        'cota_atual': nivel,
        'nivel': nivel,
        'timestamp': ts.isoformat() if ts else timezone.now().isoformat()
    })
from apps.flood.models import RotaSalva

@csrf_exempt
def api_salvar_rota(request):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)
    try:
        dados = json.loads(request.body)
        email = dados.get('email')
        nome = dados.get('nome', 'Minha Rota')
        origem_nome = dados.get('origem_nome', '')
        origem_coords = json.dumps(dados.get('origem_coords', []))
        destino_nome = dados.get('destino_nome', '')
        destino_coords = json.dumps(dados.get('destino_coords', []))
        cota_corte = float(dados.get('cota_corte', 19.0))
        distancia = dados.get('distancia', '0')
        tempo = int(dados.get('tempo', 10))

        if not email:
            return JsonResponse({'erro': 'Email é obrigatório'}, status=400)

        rota = RotaSalva.objects.create(
            email_usuario=email,
            nome_identificador=nome,
            origem_nome=origem_nome,
            origem_coords=origem_coords,
            destino_nome=destino_nome,
            destino_coords=destino_coords,
            cota_corte=cota_corte,
            distancia_km=distancia,
            tempo_min=tempo
        )

        return JsonResponse({'status': 'sucesso', 'id': rota.id})
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)

def api_listar_rotas(request):
    email = request.GET.get('email')
    if not email:
        return JsonResponse({'rotas': []})
    
    rotas = RotaSalva.objects.filter(email_usuario=email).order_by('-criado_em')
    resultado = []
    for r in rotas:
        try:
            o_coords = json.loads(r.origem_coords)
            d_coords = json.loads(r.destino_coords)
        except Exception:
            o_coords, d_coords = [], []
            
        resultado.append({
            'id': r.id,
            'nome': r.nome_identificador,
            'origem_nome': r.origem_nome,
            'origem_coords': o_coords,
            'destino_nome': r.destino_nome,
            'destino_coords': d_coords,
            'cota_corte': r.cota_corte,
            'distancia': r.distancia_km,
            'tempo': r.tempo_min
        })
    return JsonResponse({'rotas': resultado})

@csrf_exempt
def api_excluir_rota(request, rota_id):
    try:
        RotaSalva.objects.filter(id=rota_id).delete()
        return JsonResponse({'status': 'sucesso'})
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)
