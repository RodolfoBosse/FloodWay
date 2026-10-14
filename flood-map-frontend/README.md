# Mapa de Enchentes - Frontend React

Aplicação web interativa para visualizar enchentes em Lajeado/RS em tempo real.

## 📋 Pré-requisitos

- Node.js 16+ e npm/yarn
- Backend Django rodando em `http://localhost:8000`

## 🚀 Instalação Rápida

### 1. Instalar dependências
```bash
npm install
# ou
yarn install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Editar .env conforme necessário
```

### 3. Iniciar servidor de desenvolvimento
```bash
npm run dev
# ou
yarn dev
```

Acesse: `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
flood-map-frontend/
├── src/
│   ├── components/
│   │   ├── MapaInterativo.jsx      # Mapa com Leaflet
│   │   ├── PainelControle.jsx      # Painel lateral de controle
│   │   └── GraficoCotas.jsx        # Gráfico de série temporal
│   ├── services/
│   │   └── api.js                  # Cliente HTTP para API
│   ├── App.jsx                     # Componente principal
│   ├── App.css                     # Estilos
│   └── main.jsx                    # Entry point
├── index.html                      # HTML principal
├── package.json                    # Dependências
├── vite.config.js                  # Configuração Vite
├── tailwind.config.js              # Configuração Tailwind
└── postcss.config.js               # Configuração PostCSS
```

## 📦 Dependências Principais

- **React 18**: Framework UI
- **Leaflet**: Biblioteca de mapas
- **react-leaflet**: Wrapper React para Leaflet
- **Recharts**: Gráficos e charts
- **Tailwind CSS**: Utilitários de CSS
- **Axios**: Cliente HTTP
- **date-fns**: Manipulação de datas
- **lucide-react**: Ícones

## 🎯 Funcionalidades

### 1. Mapa Interativo
- Visualizar ruas de Lajeado no mapa
- Cores diferentes para status (aberta, alerta, bloqueada)
- Popup com informações de altimetria
- Integração com OpenStreetMap

### 2. Painel de Controle
- Status atual da cota do rio
- Lista de ruas bloqueadas
- Botões de ação (Google Maps, Waze)
- Alertas em tempo real

### 3. Gráficos
- Série temporal de cotas (últimos 30 dias)
- Linhas de referência (crítica, alerta)
- Estatísticas (min, max, média)
- Tooltip customizado

### 4. Responsividade
- Layout adaptativo para mobile e desktop
- Componentes fluidos
- Scroll em painéis quando necessário

## 🔧 Configuração de API

O frontend se conecta ao backend Django em `http://localhost:8000/api`.

Se o backend está rodando em outro local, editar `.env`:
```
VITE_API_BASE_URL=https://seu-backend.com/api
```

## 📡 Endpoints Utilizados

```
GET  /api/v1/cota/[cidade]/              - Cota atual
GET  /api/v1/ruas/                        - Todas as ruas
GET  /api/v1/ruas/afetadas/               - Ruas bloqueadas
GET  /api/v1/mapa/status/                 - Status completo
GET  /api/v1/cotas/timeseries/            - Série temporal
GET  /api/v1/historico/alagamentos/       - Histórico
GET  /api/v1/relatorio/diario/            - Relatório diário
```

## 🎨 Customização

### Cores
Editar `tailwind.config.js`:
```javascript
colors: {
  'flood-normal': '#10b981',    // Verde
  'flood-alert': '#f59e0b',     // Âmbar
  'flood-critical': '#ef4444',  // Vermelho
}
```

### Zoom e Centro do Mapa
Editar `MapaInterativo.jsx`:
```javascript
const config = {
  centro: [-29.4669, -51.9611],
  zoom: 14,
}
```

### Intervalo de Atualização
Editar `App.jsx`:
```javascript
// Atualizar a cada 60 segundos
const intervalo = setInterval(carregarDados, 60000)
```

## 🐛 Troubleshooting

### Erro: "Cannot GET /"
- Verificar se o servidor Vite está rodando
- Deletar cache: `rm -rf node_modules package-lock.json`
- Reinstalar: `npm install`

### API retorna 404
- Verificar se backend Django está rodando em `http://localhost:8000`
- Verificar CORS configurado em `settings.py` do Django
- Verificar variável `VITE_API_BASE_URL` no `.env`

### Mapa não aparece
- Verificar conexão com OpenStreetMap
- Inspecionar console do navegador para erros
- Verificar se Leaflet CSS foi carregado

### Dados antigos no mapa
- Limpar cache: `Ctrl+Shift+Delete` ou `Cmd+Shift+Delete`
- Forçar atualização: `Ctrl+F5` ou `Cmd+Shift+R`

## 📱 Deploy

### Build para produção
```bash
npm run build
```

Gera pasta `dist/` pronta para deploy.

### Deploy no Vercel
```bash
npm install -g vercel
vercel
```

### Deploy no Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 🔐 Variáveis de Ambiente para Produção

```
VITE_API_BASE_URL=https://seu-backend.com/api
VITE_DEBUG=false
```

## 📊 Performance

- Code splitting automático com Vite
- Lazy loading de componentes
- Otimização de imagens
- Cache de dados da API

## 🤝 Contribuindo

Para contribuir ao projeto:
1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

MIT License - veja LICENSE para detalhes

## 📞 Suporte

Para dúvidas ou bugs, abra uma issue no repositório.

---

**Desenvolvido para Lajeado/RS** 🌊
