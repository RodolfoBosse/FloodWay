# Manual Simples - Windows

## Passo 1: Abra PowerShell

Pressione: `Win + X` e escolha **PowerShell**

## Passo 2: Navegue para a pasta

```powershell
cd D:\User_Engenharia06\Documentos\FloodWay
```

## Passo 3: Abra 4 PowerShells (para ter 4 terminais)

Abra PowerShell 4 vezes (Win + X, escolha PowerShell cada vez)

---

## Terminal 1 - Backend Django

```powershell
cd D:\User_Engenharia06\Documentos\FloodWay\flood-map-backend
```

```powershell
venv\Scripts\activate
```

```powershell
python manage.py migrate
```

```powershell
python manage.py createsuperuser --noinput --username admin --email admin@example.com
```

```powershell
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); u = User.objects.filter(username='admin').first(); u and u.set_password('admin123') and u.save()"
```

```powershell
Get-Content seed_example_data.py | python manage.py shell
```

```powershell
python manage.py runserver
```

**DEIXE RODANDO!**

---

## Terminal 2 - Frontend React

```powershell
cd D:\User_Engenharia06\Documentos\FloodWay\flood-map-frontend
```

```powershell
npm install
```

```powershell
npm run dev
```

**DEIXE RODANDO!**

---

## Terminal 3 - Celery (OPCIONAL)

```powershell
cd D:\User_Engenharia06\Documentos\FloodWay\flood-map-backend
```

```powershell
venv\Scripts\activate
```

```powershell
celery -A config worker -l info
```

**DEIXE RODANDO!**

---

## Terminal 4 - Disponível

Deixe para debugging ou comandos extras

---

## Acesse o Mapa

Abra navegador e acesse:

```
http://localhost:5173
```

**Pronto!** 🎉

---

## Admin

```
http://localhost:8000/admin
User: admin
Senha: admin123
```

---

## Notas

- Se der erro "command not found", reinicie PowerShell
- Se a porta já estiver em uso, feche outros Django/React
- Se npm não funcionar, instale Node.js em https://nodejs.org
- Se python não funcionar, instale Python em https://python.org
