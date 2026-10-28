from django.urls import path
from apps.flood import views, views_api, views_auth

urlpatterns = [
    # Autenticação Real e LGPD
    path('v1/auth/google/', views_auth.api_google_login, name='api_google_login'),
    path('v1/auth/cadastro/', views_auth.api_cadastro, name='api_cadastro'),
    path('v1/auth/login/', views_auth.api_login, name='api_login'),
    path('v1/auth/me/', views_auth.api_me, name='api_me'),
    path('v1/auth/excluir-conta/', views_auth.api_excluir_conta, name='api_excluir_conta'),

    path('v1/cota/atual/', views_api.api_cota_atual, name='api_cota_atual'),
    path('v1/cota/atual-sync/', views_api.api_cota_atual, name='api_cota_atual_sync'),
    path('v1/cota/lajeado/', views_api.api_cota_atual, name='api_cota_lajeado'),
    path('v1/cota/', views_api.api_cota_atual, name='api_cota_base'),
    path('v1/ruas/', views.RuasView.as_view(), name='ruas-lista'),
    path('v1/ruas/afetadas/', views.RuasAfetadasView.as_view(), name='ruas-afetadas'),
    path('v1/mapa/status/', views.MapaStatusView.as_view(), name='mapa-status'),
    path('v1/historico/alagamentos/', views.HistoricoView.as_view(), name='historico-alagamentos'),
    path('v1/relatorio/diario/', views.RelatorioDiarioView.as_view(), name='relatorio-diario'),
    path('v1/cotas/timeseries/', views.CotasTimeseriesView.as_view(), name='cotas-timeseries'),
    path('v1/perfil/salvar/', views.salvar_perfil_sentinela, name='salvar_perfil'),
    path('v1/rotas/salvar/', views.api_salvar_rota, name='salvar_rota'),
    path('v1/rotas/listar/', views.api_listar_rotas, name='listar_rotas'),
    path('v1/rotas/<int:rota_id>/excluir/', views.api_excluir_rota, name='excluir_rota'),
]
