# 🤖 WhatsApp AI - API Server

Servidor Node.js para gerenciar produtos e usuários pausados do sistema WhatsApp AI.

## 🚀 Funcionalidades

### 📦 Produtos
- ✅ Listar todos os produtos
- ✅ Adicionar novo produto
- ✅ Editar produto (nome, quantidade, valor)
- ✅ Remover produto
- ✅ API compatível com n8n

### ⏸️ Usuários Pausados
- ✅ Listar usuários pausados
- ✅ Pausar usuário (para atendimento manual)
- ✅ Reativar usuário (volta para IA)
- ✅ API compatível com n8n

### 🎛️ Interface Admin
- ✅ Painel web completo
- ✅ Edição inline de produtos
- ✅ Estatísticas em tempo real
- ✅ Interface responsiva

## 📡 API Endpoints

### Produtos
```
GET    /api/produtos           # Listar produtos
GET    /api/produtos/:id       # Buscar produto por ID
POST   /api/produtos           # Criar produto
PUT    /api/produtos/:id       # Atualizar produto
DELETE /api/produtos/:id       # Remover produto

# Compatibilidade n8n
GET    /produtos               # Retorna JSON dos produtos
```

### Usuários Pausados
```
GET    /api/pausados           # Listar pausados
GET    /api/pausados/:numero   # Verificar se pausado
POST   /api/pausados           # Pausar usuário
DELETE /api/pausados/:numero   # Reativar usuário

# Compatibilidade n8n
GET    /pausados               # Retorna JSON dos pausados
```

### Sistema
```
GET    /health                 # Status do sistema
GET    /admin                  # Painel administrativo
```

## 🛠️ Instalação Local

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Desenvolvimento (com nodemon)
npm run dev
```

O servidor estará disponível em: http://localhost:3000

## 🐳 Deploy no EasyPanel

1. **Fazer upload dos arquivos** para o EasyPanel
2. **Criar novo serviço** do tipo "Docker"
3. **Usar o Dockerfile** incluído
4. **Configurar porta**: 3000
5. **Deploy!**

### Variáveis de Ambiente (Opcionais)
```
PORT=3000                # Porta do servidor (padrão: 3000)
```

## 📁 Estrutura de Arquivos

```
servidor-api/
├── server.js           # Servidor principal
├── package.json        # Dependências
├── Dockerfile          # Container Docker
├── data/              # Dados persistentes
│   ├── produtos.json   # Banco de produtos
│   └── pausados.json   # Usuários pausados
└── public/admin/       # Interface web
    ├── index.html      # Painel admin
    └── admin.js        # JavaScript do admin
```

## 🔧 Integração com n8n

### Para Produtos (substitua jsonkeeper):
```
URL: https://seu-servidor.com/produtos
```

### Para Verificar Usuário Pausado:
```javascript
// No n8n - verificar se usuário está pausado
const response = await $http.request({
  method: 'GET',
  url: 'https://seu-servidor.com/api/pausados/5511999999999'
});

const estaPausado = response.pausado;
```

### Para Pausar Usuário:
```javascript
// No n8n - pausar usuário
await $http.request({
  method: 'POST',
  url: 'https://seu-servidor.com/api/pausados',
  data: {
    numero: '5511999999999',
    motivo: 'Solicitado pelo cliente'
  }
});
```

## 🔒 Segurança

⚠️ **Este servidor não tem autenticação** conforme solicitado. 
Para produção com dados sensíveis, considere adicionar:

- Autenticação JWT
- Rate limiting
- HTTPS obrigatório
- Validação de entrada mais rigorosa

## 📊 Monitoramento

- **Status**: `/health` - Mostra status e estatísticas
- **Logs**: Aparecem no console do servidor
- **Dados**: Salvos em arquivos JSON na pasta `data/`

## 🆘 Troubleshooting

### Problemas comuns:

1. **Porta em uso**: Alterar PORT no .env
2. **Permissão de escrita**: Verificar permissões da pasta `data/`
3. **Memória**: Servidor leve, mas monitore uso com muitos produtos

---

🚀 **Pronto para produção no EasyPanel!**