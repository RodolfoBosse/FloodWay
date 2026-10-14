# Guia de Deployment - Mapa de Enchentes

## 📌 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                      Usuários (Navegador)                   │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS
        ┌────────▼────────────┐
        │  Frontend React     │
        │  (Vercel/Netlify)   │
        │  http://localhost:5173 (dev)
        └────────┬────────────┘
                 │ HTTPS/HTTP
        ┌────────▼────────────────────┐
        │   Backend Django REST API   │
        │   Gunicorn + Nginx          │
        │   http://localhost:8000 (dev)
        └────────┬────────────────────┘
                 │
        ┌────────┴─────────────┬───────────────┐
        │                      │               │
    ┌───▼──────┐      ┌────────▼─────┐   ┌────▼────┐
    │PostgreSQL│      │ Redis Celery │   │Nivelgua │
    │Database  │      │   Worker     │   │   íba   │
    └──────────┘      └──────────────┘   └─────────┘
```

---

## 🚀 FASE 1: Setup Local (Desenvolvimento)

### Backend Django

```bash
# 1. Criar estrutura
mkdir flood-map-backend && cd flood-map-backend

# 2. Venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 3. Instalar
pip install -r requirements.txt

# 4. Configurar BD
python manage.py migrate

# 5. Criar admin
python manage.py createsuperuser

# 6. Rodar servidor
python manage.py runserver
# → http://localhost:8000
```

### Frontend React

```bash
# 1. Criar projeto
cd ../flood-map-frontend

# 2. Instalar
npm install

# 3. Criar .env
cp .env.example .env

# 4. Rodar dev server
npm run dev
# → http://localhost:5173
```

### Redis + Celery (em terminais separados)

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Celery Worker
cd flood-map-backend
celery -A config worker -l info

# Terminal 3: Celery Beat (scheduler)
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

## 🌐 FASE 2: Deploy na Nuvem (Produção)

### Opção A: Heroku (Mais Fácil)

#### Backend Django

```bash
cd flood-map-backend

# 1. Instalar Heroku CLI
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

# 2. Login
heroku login

# 3. Criar app
heroku create meu-flood-map-backend

# 4. Adicionar PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# 5. Adicionar Redis
heroku addons:create heroku-redis:premium-0

# 6. Configurar variáveis
heroku config:set SECRET_KEY=sua-chave-super-secreta
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS=meu-flood-map-backend.herokuapp.com

# 7. Criar Procfile
cat > Procfile << EOF
web: gunicorn config.wsgi --log-file -
worker: celery -A config worker -l info
beat: celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
EOF

# 8. Fazer deploy
git push heroku main

# 9. Migrations
heroku run python manage.py migrate

# 10. Criar superuser
heroku run python manage.py createsuperuser
```

#### Frontend React

```bash
cd flood-map-frontend

# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Configurar variável de ambiente
vercel env add VITE_API_BASE_URL
# Entrar: https://meu-flood-map-backend.herokuapp.com/api

# 4. Deploy final
vercel --prod
```

---

### Opção B: DigitalOcean App Platform (Mais Controle)

#### Backend Django

```bash
# 1. Criar droplet Ubuntu 20.04 (2GB RAM, $6/mês)

# 2. SSH no droplet
ssh root@seu_ip

# 3. Setup básico
apt update && apt upgrade -y
apt install -y python3-pip python3-venv postgresql postgresql-contrib redis-server nginx git

# 4. Clonar projeto
git clone seu-repo.git
cd flood-map-backend

# 5. Venv
python3 -m venv venv
source venv/bin/activate

# 6. Instalar
pip install -r requirements.txt

# 7. Configurar PostgreSQL
sudo -u postgres psql
CREATE DATABASE flood_map;
CREATE USER flood_admin WITH PASSWORD 'senha-super-segura';
GRANT ALL PRIVILEGES ON DATABASE flood_map TO flood_admin;
\q

# 8. Migrar
python manage.py migrate
python manage.py createsuperuser

# 9. Criar systemd service para gunicorn
sudo cat > /etc/systemd/system/flood-gunicorn.service << EOF
[Unit]
Description=Gunicorn service for flood-map
After=network.target

[Service]
User=www-data
WorkingDirectory=/home/seu-usuario/flood-map-backend
ExecStart=/home/seu-usuario/flood-map-backend/venv/bin/gunicorn --bind 127.0.0.1:8000 config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 10. Criar systemd service para Celery
sudo cat > /etc/systemd/system/flood-celery.service << EOF
[Unit]
Description=Celery service for flood-map
After=network.target

[Service]
User=www-data
WorkingDirectory=/home/seu-usuario/flood-map-backend
ExecStart=/home/seu-usuario/flood-map-backend/venv/bin/celery -A config worker -l info
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 11. Iniciar serviços
sudo systemctl daemon-reload
sudo systemctl start flood-gunicorn
sudo systemctl start flood-celery
sudo systemctl enable flood-gunicorn
sudo systemctl enable flood-celery

# 12. Configurar Nginx
sudo cat > /etc/nginx/sites-available/flood-map << EOF
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /static/ {
        alias /home/seu-usuario/flood-map-backend/staticfiles/;
    }
}
EOF

# 13. Habilitar Nginx
sudo ln -s /etc/nginx/sites-available/flood-map /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 14. HTTPS com Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

---

## 🔒 Checklist de Segurança

- [ ] `SECRET_KEY` mudado e seguro
- [ ] `DEBUG=False` em produção
- [ ] HTTPS habilitado
- [ ] CORS configurado apenas para frontend
- [ ] Banco de dados com senha forte
- [ ] Redis com autenticação
- [ ] Backups diários do PostgreSQL
- [ ] Variáveis sensíveis em variáveis de ambiente
- [ ] Firewall habilitado (fechar portas desnecessárias)
- [ ] Certificado SSL válido

---

## 📊 Monitoramento

### Logs

```bash
# Heroku
heroku logs --tail

# DigitalOcean
sudo journalctl -u flood-gunicorn -f
sudo journalctl -u flood-celery -f
```

### Health Check

```bash
# Checar se API está respondendo
curl https://seu-backend.com/api/v1/cota/

# Verificar status Celery
python manage.py shell
>>> from celery.app.control import Inspect
>>> insp = Inspect()
>>> insp.active()
```

### Backup do Banco

```bash
# PostgreSQL - Backup
pg_dump -U flood_admin flood_map > backup.sql

# PostgreSQL - Restore
psql -U flood_admin flood_map < backup.sql

# Agendado (cron)
0 2 * * * pg_dump -U flood_admin flood_map | gzip > /backups/flood_map_$(date +\%Y\%m\%d).sql.gz
```

---

## 🚀 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Backend to Heroku
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
        run: |
          git push https://heroku:$HEROKU_API_KEY@git.heroku.com/meu-flood-map-backend.git main
      
      - name: Deploy Frontend to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm run build
          vercel --prod --token=$VERCEL_TOKEN
```

---

## 📈 Escalabilidade Futura

### Para crescimento:
1. PostgreSQL gerenciado (AWS RDS)
2. Redis gerenciado (AWS ElastiCache)
3. CDN para static files (CloudFront)
4. Load balancer (ALB)
5. Auto-scaling de workers Celery
6. Cache distribuído (Redis)

### Métricas a monitorar:
- Tempo de resposta da API
- Taxa de erro
- Uso de CPU/Memória
- Tamanho da fila Celery
- Latência de banco de dados

---

## 📝 Checklist Final

Backend:
- [ ] Migrations executadas
- [ ] Super user criado
- [ ] Variáveis de ambiente configuradas
- [ ] CORS habilitado
- [ ] SSL/HTTPS funcionando
- [ ] Celery rodando

Frontend:
- [ ] Build otimizado
- [ ] API URL configurada
- [ ] Cache configurado
- [ ] PWA habilitado (opcional)
- [ ] Analytics integrado (opcional)

Monitoramento:
- [ ] Logs centralizados
- [ ] Alertas configurados
- [ ] Backup agendado
- [ ] Health checks ativas

---

Sucesso no deploy! 🚀
