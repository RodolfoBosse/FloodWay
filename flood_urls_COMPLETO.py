from django.urls import path
from . import views

app_name = 'flood'

urlpatterns = [
    path('v1/cota/<str:cidade>/', views.CotaAtualView.as_view(), name='cota-atual'),
    path('v1/cota/', views.CotaAtualView.as_view(), name='cota-atual-lajeado'),
    path('v1/ruas/', views.RuasView.as_view(), name='ruas-lista'),
    path('v1/ruas/afetadas/', views.RuasAfetadasView.as_view(), name='ruas-afetadas'),
    path('v1/mapa/status/', views.MapaStatusView.as_view(), name='mapa-status'),
    path('v1/historico/alagamentos/', views.HistoricoView.as_view(), name='historico-alagamentos'),
    path('v1/relatorio/diario/', views.RelatorioDiarioView.as_view(), name='relatorio-diario'),
    path('v1/cotas/timeseries/', views.CotasTimeseriesView.as_view(), name='cotas-timeseries'),
]
