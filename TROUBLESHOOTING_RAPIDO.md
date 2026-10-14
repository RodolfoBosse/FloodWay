# Troubleshooting Rápido

## ❌ Erro: "python command not found"

**Solução:**
1. Instale Python: https://python.org
2. **MARQUE** "Add Python to PATH" durante instalação
3. Reinicie PowerShell/CMD
4. Teste: `python --version`

---

## ❌ Erro: "npm command not found"

**Solução:**
1. Instale Node.js: https://nodejs.org
2. Reinicie PowerShell/CMD
3. Teste: `npm --version`

---

## ❌ Erro: "Port 8000 already in use"

**Solução:**
```powershell
python manage.py runserver 8001
```

Depois acesse: `http://localhost:8001`

---

## ❌ Erro: "Port 5173 already in use"

**Solução:**
```powershell
npm run dev -- --port 5174
```

Depois acesse: `http://localhost:5174`

---

## ❌ Erro: "ModuleNotFoundError"

**Solução:**
```powershell
pip install -r requirements.txt
```

---

## ❌ Frontend não conecta ao backend

**Solução:**
1. Verifique se backend está rodando: `http://localhost:8000/api/v1/cota/`
2. Verifique arquivo `.env` em `flood-map-frontend`:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
3. Reinicie Frontend (Ctrl + C, depois npm run dev)

---

## ❌ "venv not found"

**Solução:**
```powershell
cd flood-map-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## ❌ Banco de dados corrompido

**Solução:**
```powershell
cd flood-map-backend
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

---

## ✅ Tudo funcionando?

Teste estas URLs:

```
http://localhost:8000/api/v1/cota/           (dados da cota)
http://localhost:8000/api/v1/ruas/           (lista de ruas)
http://localhost:8000/api/v1/mapa/status/    (status geral)
http://localhost:5173                        (mapa visual)
http://localhost:8000/admin                  (painel admin)
```

Se todas retornam dados, **está funcionando!** ✅

---

## 🆘 Ainda com erro?

1. Copie a mensagem de erro completa
2. Procure em `SETUP_WINDOWS.md`
3. Se não encontrar, procure no Google
4. Último recurso: reinstale tudo limpo
