from rest_framework import serializers
from django.conf import settings


class CotaAtualSerializer(serializers.Serializer):
    """Serializer para dados de cota atual"""
    
    cidade = serializers.CharField(max_length=50)
    nivel = serializers.FloatField()
    status = serializers.CharField(max_length=20)
    timestamp = serializers.DateTimeField()
    fonte = serializers.CharField(max_length=50)
    
    # Info adicional
    cota_critica = serializers.SerializerMethodField()
    percentual_critica = serializers.SerializerMethodField()
    ruas_bloqueadas_count = serializers.SerializerMethodField()
    
    def get_cota_critica(self, obj):
        return settings.FLOOD_MAP_CONFIG['COTA_CRITICA']
    
    def get_percentual_critica(self, obj):
        critica = settings.FLOOD_MAP_CONFIG['COTA_CRITICA']
        if critica > 0:
            percentual = (obj.nivel / critica) * 100
            return round(percentual, 2)
        return 0
    
    def get_ruas_bloqueadas_count(self, obj):
        from apps.flood.models import RuaAltimetria
        ruas = RuaAltimetria.objects.filter(
            cidade=obj.cidade,
            ativa=True,
            cota_bloqueio__lte=obj.nivel
        ).count()
        return ruas


class RuaAltimetriaSerializer(serializers.Serializer):
    """Serializer para dados de ruas e altimetrias"""
    
    id = serializers.IntegerField()
    cidade = serializers.CharField(max_length=50)
    nome = serializers.CharField(max_length=255)
    
    # Coordenadas
    latitude_inicio = serializers.FloatField()
    longitude_inicio = serializers.FloatField()
    latitude_fim = serializers.FloatField()
    longitude_fim = serializers.FloatField()
    
    # Altimetria
    altitude_min = serializers.FloatField()
    altitude_max = serializers.FloatField()
    cota_bloqueio = serializers.FloatField()
    
    # Metadata
    descricao = serializers.CharField(allow_blank=True)
    ativa = serializers.BooleanField()
    
    # Status calculado
    bloqueada = serializers.SerializerMethodField()
    
    def get_bloqueada(self, obj):
        # Se houver cota_atual no contexto, verificar se está bloqueada
        cota_atual = self.context.get('cota_atual')
        if cota_atual is not None:
            return obj.is_bloqueada(cota_atual)
        return False


class MapaStatusSerializer(serializers.Serializer):
    """
    Serializer para retornar status completo do mapa
    (cotas + ruas bloqueadas)
    """
    cota_atual = CotaAtualSerializer()
    ruas = serializers.SerializerMethodField()
    config = serializers.SerializerMethodField()
    
    def get_ruas(self, obj):
        from apps.flood.models import RuaAltimetria
        ruas = RuaAltimetria.objects.filter(
            cidade=obj['cota_atual'].cidade,
            ativa=True
        )
        
        serializer = RuaAltimetriaSerializer(
            ruas,
            many=True,
            context={'cota_atual': obj['cota_atual'].nivel}
        )
        return serializer.data
    
    def get_config(self, obj):
        config = settings.FLOOD_MAP_CONFIG
        return {
            'cidade': obj['cota_atual'].cidade.upper(),
            'cota_critica': config['COTA_CRITICA'],
            'cota_min': config['COTA_MIN'],
            'cota_max': config['COTA_MAX'],
            'centro': config['LAJEADO_CENTER'],
            'bounds': config['LAJEADO_BOUNDS'],
            'zoom_padrao': 14,
        }


class HistoricoAlagamentoSerializer(serializers.Serializer):
    """Serializer para histórico de alagamentos"""
    
    id = serializers.IntegerField()
    rua_nome = serializers.SerializerMethodField()
    rua_id = serializers.IntegerField(source='rua.id')
    cota_inicio = serializers.FloatField()
    timestamp_bloqueio = serializers.DateTimeField()
    timestamp_reabertura = serializers.DateTimeField(allow_null=True)
    duracao_minutos = serializers.IntegerField(allow_null=True)
    
    def get_rua_nome(self, obj):
        return obj.rua.nome


class RotaCalculadaSerializer(serializers.Serializer):
    """Serializer para rotas calculadas"""
    
    id = serializers.IntegerField()
    latitude_origem = serializers.FloatField()
    longitude_origem = serializers.FloatField()
    latitude_destino = serializers.FloatField()
    longitude_destino = serializers.FloatField()
    
    cota_no_momento = serializers.FloatField()
    ruas_desviadas = serializers.IntegerField()
    tipo_navegacao = serializers.CharField(max_length=20)
    timestamp = serializers.DateTimeField()


class RelatorioDiarioSerializer(serializers.Serializer):
    """Serializer para relatório diário"""
    
    data = serializers.DateField()
    cota_minima = serializers.FloatField()
    cota_maxima = serializers.FloatField()
    cota_media = serializers.FloatField()
    total_alagamentos = serializers.IntegerField()
    total_observacoes = serializers.IntegerField()
