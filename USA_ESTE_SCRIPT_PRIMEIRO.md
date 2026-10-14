# 🚀 USE ESTE SCRIPT PRIMEIRO!

## ⚠️ IMPORTANTE

Os guias anteriores (`COMECE_AQUI_WINDOWS.txt`, etc) assumem que você JÁ tem a estrutura Django criada.

**Você NÃO tem ainda!**

Este script cria TUDO automaticamente para você.

---

## ✅ Como usar

### **Passo 1: Abra PowerShell**

Pressione: `Win + X` → escolha **Windows PowerShell**

### **Passo 2: Navegue para a pasta**

```powershell
cd D:\User_Engenharia06\Documentos\FloodWay
```

(Se sua pasta for diferente, use o caminho correto)

### **Passo 3: Execute o script**

```powershell
.\CRIAR_ESTRUTURA_DJANGO.ps1
```

### **Passo 4: Espere terminar**

O script vai:
- ✅ Criar ambiente virtual
- ✅ Instalar dependências (Django, DRF, etc)
- ✅ Criar projeto Django (`config`)
- ✅ Criar app (`apps/flood`)
- ✅ Copiar models, views, serializers, urls
- ✅ Configurar settings.py e urls.py
- ✅ Rodar migrações
- ✅ Criar usuário admin
- ✅ Carregar dados de exemplo

Leva **5-10 minutos**

---

## 📁 Resultado esperado

Após executar, você terá:

```
flood-map-backend/
├── config/                  ← Projeto Django criado
│   ├── __init__.py
│   ├── settings.py          ← ✅ Configurado
│   ├── urls.py              ← ✅ Configurado
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── __init__.py
│   └── flood/               ← Seu app
│       ├── __init__.py
│       ├── models.py        ← ✅ Copiado
│       ├── views.py         ← ✅ Copiado
│       ├── serializers.py   ← ✅ Copiado
│       ├── urls.py          ← ✅ Copiado
│       ├── admin.py
│       ├── apps.py
│       ├── migrations/
│       │   └── __init__.py
│       └── tests.py
├── manage.py                ← ✅ Pronto
├── db.sqlite3               ← Banco criado
├── venv/                    ← Ambiente virtual
└── requirements.txt
```

---

## 🎯 Depois (próximo passo)

Após o script terminar com sucesso, execute os 4 terminais:

### **Terminal 1 - Backend**
```powershell
cd flood-map-backend
venv\Scripts\activate
python manage.py runserver
```

### **Terminal 2 - Frontend**
```powershell
cd flood-map-frontend
npm install
npm run dev
```

### **Terminal 3 - Celery**
```powershell
cd flood-map-backend
venv\Scripts\activate
celery -A config worker -l info
```

### **Terminal 4 - Disponível**
Para debugging ou comandos extras

---

## 🌐 Acesse

Abra navegador:
```
http://localhost:5173
```

**Pronto!** Seu mapa deve funcionar! 🗺️

---

## ✅ Se tudo der certo

Você verá no terminal do backend:
```
Starting development server at http://127.0.0.1:8000/
```

E no frontend:
```
VITE v5.0.0 ready in XXX ms
Local: http://localhost:5173/
```

---

## ❌ Se der erro

Veja o arquivo: `TROUBLESHOOTING_RAPIDO.md`

---

## 📝 Resumo

| O que | Comando |
|------|---------|
| Criar estrutura | `.\CRIAR_ESTRUTURA_DJANGO.ps1` |
| Backend | `python manage.py runserver` |
| Frontend | `npm run dev` |
| Celery | `celery -A config worker -l info` |
| Admin | http://localhost:8000/admin |
| Usuário | admin |
| Senha | admin123 |

---

**Pronto!** Boa sorte! 🚀
