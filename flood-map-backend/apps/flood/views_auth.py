import json
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from apps.flood.models import PerfilSentinela

def obter_ip_cliente(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')

@csrf_exempt
def api_cadastro(request):
    """
    Cadastro de Usuário com Aceite Explícito de LGPD (Art. 7º, I da Lei 13.709/2018)
    """
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        dados = json.loads(request.body)
        nome = (dados.get('nome') or '').strip()
        email = (dados.get('email') or '').strip().lower()
        senha = dados.get('senha')
        whatsapp = (dados.get('whatsapp') or '').strip()
        aceitou_lgpd = bool(dados.get('aceitou_lgpd'))

        if not email or not senha:
            return JsonResponse({'erro': 'E-mail e senha são obrigatórios.'}, status=400)

        if len(senha) < 6:
            return JsonResponse({'erro': 'A senha deve ter pelo menos 6 caracteres.'}, status=400)

        if not aceitou_lgpd:
            return JsonResponse({
                'erro': 'É obrigatório aceitar os Termos de Uso e a Política de Privacidade (LGPD) para criar uma conta.'
            }, status=400)

        if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
            return JsonResponse({'erro': 'Já existe uma conta cadastrada com este e-mail. Faça login.'}, status=400)

        # 1. Cria usuário padrão do Django com hash seguro
        user = User.objects.create_user(
            username=email,
            email=email,
            password=senha,
            first_name=nome
        )

        # 2. Cria o perfil do Sentinela com registro LGPD
        ip = obter_ip_cliente(request)
        perfil = PerfilSentinela.objects.create(
            user=user,
            nome=nome or email.split('@')[0],
            email=email,
            whatsapp=whatsapp,
            aceitou_termos_lgpd=True,
            ip_aceite_lgpd=ip,
            versao_termos_lgpd="1.0-2024"
        )

        # 3. Gera Token de Sessão REST
        token, _ = Token.objects.get_or_create(user=user)

        return JsonResponse({
            'status': 'sucesso',
            'token': token.key,
            'usuario': {
                'id': user.id,
                'nome': perfil.nome,
                'email': perfil.email,
                'whatsapp': perfil.whatsapp,
                'cota_terreno': perfil.cota_terreno,
                'endereco': perfil.endereco_completo,
                'bairro': perfil.bairro,
                'latitude': perfil.latitude,
                'longitude': perfil.longitude,
                'residencia': {
                    'endereco': perfil.endereco_completo,
                    'bairro': perfil.bairro,
                    'lat': perfil.latitude,
                    'lon': perfil.longitude,
                    'cota': perfil.cota_terreno
                } if perfil.latitude and perfil.longitude else None
            }
        }, status=201)

    except Exception as e:
        return JsonResponse({'erro': f'Erro ao processar cadastro: {str(e)}'}, status=500)


@csrf_exempt
def api_login(request):
    """
    Login Real com Autenticação de Senha e Token DRF
    """
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    try:
        dados = json.loads(request.body)
        email = (dados.get('email') or '').strip().lower()
        senha = dados.get('senha')

        if not email or not senha:
            return JsonResponse({'erro': 'Informe e-mail e senha.'}, status=400)

        # Autentica pelo username (que armazenamos como o próprio e-mail)
        user = authenticate(request, username=email, password=senha)
        if not user:
            # Fallback se o username for diferente do email
            u_obj = User.objects.filter(email=email).first()
            if u_obj:
                user = authenticate(request, username=u_obj.username, password=senha)

        if not user:
            return JsonResponse({'erro': 'E-mail ou senha incorretos.'}, status=401)

        token, _ = Token.objects.get_or_create(user=user)
        perfil, _ = PerfilSentinela.objects.get_or_create(
            user=user,
            defaults={
                'email': user.email or email,
                'nome': user.first_name or email.split('@')[0]
            }
        )

        return JsonResponse({
            'status': 'sucesso',
            'token': token.key,
            'usuario': {
                'id': user.id,
                'nome': perfil.nome or user.first_name,
                'email': perfil.email,
                'whatsapp': perfil.whatsapp,
                'cota_terreno': perfil.cota_terreno,
                'endereco': perfil.endereco_completo,
                'bairro': perfil.bairro,
                'latitude': perfil.latitude,
                'longitude': perfil.longitude,
                'residencia': {
                    'endereco': perfil.endereco_completo,
                    'bairro': perfil.bairro,
                    'lat': perfil.latitude,
                    'lon': perfil.longitude,
                    'cota': perfil.cota_terreno
                } if perfil.latitude and perfil.longitude else None
            }
        })

    except Exception as e:
        return JsonResponse({'erro': f'Erro ao realizar login: {str(e)}'}, status=500)


@csrf_exempt
def api_me(request):
    """
    Retorna os dados do perfil autenticado
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Token '):
        return JsonResponse({'erro': 'Não autenticado'}, status=401)

    key = auth_header.split('Token ')[1].strip()
    token = Token.objects.filter(key=key).select_related('user').first()
    if not token:
        return JsonResponse({'erro': 'Sessão inválida ou expirada'}, status=401)

    user = token.user
    perfil = PerfilSentinela.objects.filter(user=user).first()
    if not perfil:
        perfil = PerfilSentinela.objects.filter(email=user.email).first()

    return JsonResponse({
        'usuario': {
            'id': user.id,
            'nome': perfil.nome if perfil else user.first_name,
            'email': user.email,
            'whatsapp': perfil.whatsapp if perfil else '',
            'cota_terreno': perfil.cota_terreno if perfil else 20.0,
            'endereco': perfil.endereco_completo if perfil else '',
            'bairro': perfil.bairro if perfil else '',
            'residencia': {
                'endereco': perfil.endereco_completo,
                'bairro': perfil.bairro,
                'lat': perfil.latitude,
                'lon': perfil.longitude,
                'cota': perfil.cota_terreno
            } if perfil and perfil.latitude and perfil.longitude else None
        }
    })


@csrf_exempt
def api_excluir_conta(request):
    """
    Cumprimento do Direito de Exclusão e Revogação do Titular (Art. 18 da LGPD)
    """
    if request.method != 'DELETE' and request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido'}, status=405)

    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Token '):
        return JsonResponse({'erro': 'Não autenticado'}, status=401)

    key = auth_header.split('Token ')[1].strip()
    token = Token.objects.filter(key=key).select_related('user').first()
    if not token:
        return JsonResponse({'erro': 'Sessão inválida'}, status=401)

    user = token.user
    # Deleta rotas salvas, perfil e usuário permanentemente
    PerfilSentinela.objects.filter(user=user).delete()
    user.delete()

    return JsonResponse({'status': 'sucesso', 'mensagem': 'Todos os seus dados foram permanentemente excluídos.'})

