from django.contrib import admin
from .models import CotaAtual, RuaAltimetria, HistoricoRuaAlagada

admin.site.register(CotaAtual)
admin.site.register(RuaAltimetria)
admin.site.register(HistoricoRuaAlagada)
