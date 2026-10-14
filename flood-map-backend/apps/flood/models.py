from django.db import models
from django.utils import timezone
from django.db.models import signals
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)


class CotaAtual(models.Model):
    """
    Registra o nÃ­vel atual do Rio Taquari em tempo real
    """
    cidade = models.CharField(max_length=50, default='lajeado', db_index=True)
    nivel = models.FloatField(
        help_text="NÃ­vel do rio em metros"
    )
    timestamp = models.DateTimeField(
        auto_now=True,
        help_text="Data e hora da mediÃ§Ã£o"
    )
    fonte = models.CharField(
        max_length=50,
        default='nivelguaiba',
        choices=[
            ('nivelguaiba', 'NÃ­vel GuaÃ­ba'),
            ('manual', 'Entrada Manual'),
        ]
    )
    status = models.CharField(
        max_length=20,
        default='normal',
        choices=[
            ('normal', 'Normal'),
            ('alerta', 'Alerta'),
            ('critica', 'CrÃ­tica'),
            ('alagado', 'Alagado'),
        ],
        editable=False
    )
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Cota Atual'
        verbose_name_plural = 'Cotas Atuais'
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['cidade', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.cidade.upper()}: {self.nivel}m ({self.timestamp})"
    
    def save(self, *args, **kwargs):
        # Atualizar status baseado na cota
        from django.conf import settings
        config = settings.FLOOD_MAP_CONFIG
        
        if self.nivel >= config['COTA_MAX']:
            self.status = 'alagado'
        elif self.nivel >= config['COTA_CRITICA']:
            self.status = 'critica'
        elif self.nivel >= config['COTA_CRITICA'] - 2:
            self.status = 'alerta'
        else:
            self.status = 'normal'
        
        super().save(*args, **kwargs)


class RuaAltimetria(models.Model):
    """
    Altimetria de cada rua - informa altitude min/max e cota de bloqueio
    """
    cidade = models.CharField(
        max_length=50,
        default='lajeado',
        db_index=True
    )
    nome = models.CharField(
        max_length=255,
        db_index=True
    )
    latitude_inicio = models.FloatField()
    longitude_inicio = models.FloatField()
    latitude_fim = models.FloatField()
    longitude_fim = models.FloatField()
    
    altitude_min = models.FloatField(
        help_text="Altitude mÃ­nima da rua em metros"
    )
    altitude_max = models.FloatField(
        help_text="Altitude mÃ¡xima da rua em metros"
    )
    coordenadas_json = models.JSONField(blank=True, null=True)
    cota_bloqueio = models.FloatField(
        help_text="NÃ­vel do rio a partir do qual a rua fica bloqueada"
    )
    
    descricao = models.TextField(
        blank=True,
        null=True
    )
    ativa = models.BooleanField(
        default=True
    )
    data_criacao = models.DateTimeField(
        auto_now_add=True
    )
    data_atualizacao = models.DateTimeField(
        auto_now=True
    )
    
    class Meta:
        ordering = ['nome']
        verbose_name_plural = 'Ruas e Altimetrias'
        unique_together = [['cidade', 'nome']]
        indexes = [
            models.Index(fields=['cidade', 'ativa']),
            models.Index(fields=['cota_bloqueio']),
        ]
    
    def __str__(self):
        return f"{self.nome} ({self.altitude_min}m - {self.altitude_max}m)"
    
    def is_bloqueada(self, cota_atual):
        """Verifica se a rua estÃ¡ bloqueada para uma cota especÃ­fica"""
        return cota_atual >= self.cota_bloqueio
    
    def get_coordenadas(self):
        """Retorna as coordenadas no formato [[lat1, lon1], [lat2, lon2]]"""
        return [
            [self.latitude_inicio, self.longitude_inicio],
            [self.latitude_fim, self.longitude_fim]
        ]


class HistoricoRuaAlagada(models.Model):
    """
    HistÃ³rico de quando cada rua foi alagada
    """
    rua = models.ForeignKey(
        RuaAltimetria,
        on_delete=models.CASCADE,
        related_name='historico_alagamento'
    )
    cota_inicio = models.FloatField()
    timestamp_bloqueio = models.DateTimeField(
        auto_now_add=True
    )
    timestamp_reabertura = models.DateTimeField(
        null=True,
        blank=True
    )
    duracao_minutos = models.IntegerField(
        null=True,
        blank=True,
        editable=False
    )
    
    class Meta:
        ordering = ['-timestamp_bloqueio']
        verbose_name_plural = 'HistÃ³rico de Ruas Alagadas'
    
    def __str__(self):
        return f"{self.rua.nome} - {self.timestamp_bloqueio}"
    
    def save(self, *args, **kwargs):
        # Calcular duraÃ§Ã£o se reabertura foi preenchida
        if self.timestamp_reabertura and self.timestamp_bloqueio:
            duracao = self.timestamp_reabertura - self.timestamp_bloqueio
            self.duracao_minutos = int(duracao.total_seconds() / 60)
        
        super().save(*args, **kwargs)


class RotaCalculada(models.Model):
    """
    Registra rotas calculadas pelos usuÃ¡rios
    """
    latitude_origem = models.FloatField()
    longitude_origem = models.FloatField()
    latitude_destino = models.FloatField()
    longitude_destino = models.FloatField()
    
    cota_no_momento = models.FloatField()
    ruas_desviadas = models.IntegerField(
        default=0,
        help_text="Quantidade de ruas bloqueadas que foram desviadas"
    )
    
    tipo_navegacao = models.CharField(
        max_length=20,
        choices=[
            ('google_maps', 'Google Maps'),
            ('waze', 'Waze'),
            ('outro', 'Outro'),
        ]
    )
    
    timestamp = models.DateTimeField(
        auto_now_add=True
    )
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Rotas Calculadas'
    
    def __str__(self):
        return f"Rota - {self.timestamp}"


class ConfiguracaoCidade(models.Model):
    """
    ConfiguraÃ§Ãµes por cidade
    """
    cidade = models.CharField(
        max_length=50,
        unique=True,
        primary_key=True
    )
    cota_critica = models.FloatField(
        default=19.0
    )
    cota_min = models.FloatField(
        default=3.0
    )
    cota_max = models.FloatField(
        default=25.0
    )
    centro_lat = models.FloatField()
    centro_lon = models.FloatField()
    zoom_padrao = models.IntegerField(
        default=14
    )
    
    class Meta:
        verbose_name_plural = 'ConfiguraÃ§Ãµes de Cidades'
    
    def __str__(self):
        return self.cidade.upper()


# ========== SIGNALS ==========

@receiver(signals.post_save, sender=CotaAtual)
def verificar_mudanca_status_ruas(sender, instance, created, **kwargs):
    """
    Quando a cota muda, verifica quais ruas mudaram de status
    e registra no histÃ³rico
    """
    if instance.cidade != 'lajeado':
        return
    
    # Encontrar ruas afetadas
    ruas = RuaAltimetria.objects.filter(
        cidade=instance.cidade,
        ativa=True
    )
    
    for rua in ruas:
        if rua.is_bloqueada(instance.nivel):
            # Verificar se jÃ¡ tem um registro aberto
            historico_aberto = HistoricoRuaAlagada.objects.filter(
                rua=rua,
                timestamp_reabertura__isnull=True
            ).first()
            
            if not historico_aberto:
                # Criar novo registro
                HistoricoRuaAlagada.objects.create(
                    rua=rua,
                    cota_inicio=instance.nivel
                )
        else:
            # A rua deve estar livre - fechar registros abertos
            historico_aberto = HistoricoRuaAlagada.objects.filter(
                rua=rua,
                timestamp_reabertura__isnull=True
            ).first()
            
            if historico_aberto:
                historico_aberto.timestamp_reabertura = timezone.now()
                historico_aberto.save()

    logger.info(f"Status de ruas verificado para cota {instance.nivel}m")

from django.db import models
from django.contrib.auth.models import User

class PerfilSentinela(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil', null=True, blank=True)
    nome = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    whatsapp = models.CharField(max_length=25, blank=True, null=True)
    
    # Dados da Residência / Local Monitorado
    endereco_completo = models.CharField(max_length=255, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    cota_terreno = models.FloatField(default=20.0, help_text="Altitude do solo da casa em metros")
    
    # Preferências de Alerta
    margem_aviso_metros = models.FloatField(default=1.5, help_text="Avisar quando o rio chegar a X metros da cota")
    alerta_ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nome} - {self.endereco_completo} ({self.cota_terreno}m)"
class RotaSalva(models.Model):
    perfil = models.ForeignKey(PerfilSentinela, on_delete=models.CASCADE, related_name='rotas_salvas', null=True, blank=True)
    email_usuario = models.EmailField()
    nome_identificador = models.CharField(max_length=150, help_text="Ex: Casa ⇄ Trabalho")
    origem_nome = models.CharField(max_length=255)
    origem_coords = models.CharField(max_length=100)
    destino_nome = models.CharField(max_length=255)
    destino_coords = models.CharField(max_length=100)
    cota_corte = models.FloatField(default=19.0, help_text="Ponto mais baixo da rota em metros")
    distancia_km = models.CharField(max_length=20, blank=True, null=True)
    tempo_min = models.IntegerField(default=10)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nome_identificador} ({self.cota_corte}m) - {self.email_usuario}"
