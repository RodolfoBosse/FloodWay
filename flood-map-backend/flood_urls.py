from django.urls import path
from apps.flood import views

app_name = 'flood'

urlpatterns = [
    # Cota atual
    path(
        'v1/cota/<str:cidade>/',
        views.CotaAtualView.as_view(),
        name='cota-atual'
    ),
    path(
        'v1/cota/',
        views.CotaAtualView.as_view(),
        name='cota-atual-lajeado'
    ),
    
    # Ruas
    path(
        'v1/ruas/',
        views.RuasView.as_view(),
        name='ruas-lista'
    ),
    
    # Ruas afetadas
    path(
        'v1/ruas/afetadas/',
        views.RuasAfetadasView.as_view(),
        name='ruas-afetadas'
    ),
    
    # Status completo do mapa
    path(
        'v1/mapa/status/',
        views.MapaStatusView.as_view(),
        name='mapa-status'
    ),
    
    # Histórico
    path(
        'v1/historico/alagamentos/',
        views.HistoricoView.as_view(),
        name='historico-alagamentos'
    ),
    
    # Relatórios
    path(
        'v1/relatorio/diario/',
        views.RelatorioDiarioView.as_view(),
        name='relatorio-diario'
    ),
    
    # Séries temporais
    path(
        'v1/cotas/timeseries/',
        views.CotasTimeseriesView.as_view(),
        name='cotas-timeseries'
    ),
]
