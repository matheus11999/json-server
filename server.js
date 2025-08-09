const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// --- Arquivos de Dados ---
const DATA_DIR = path.join(__dirname, 'app', 'data');
const PRODUTOS_FILE = path.join(DATA_DIR, 'produtos.json');
const USUARIOS_FILE = path.join(DATA_DIR, 'usuarios.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// --- Inicialização ---
if (!fs.existsSync(PRODUTOS_FILE)) {
  fs.writeFileSync(PRODUTOS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(USUARIOS_FILE)) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(CONFIG_FILE)) {
  const defaultConfig = {
    ia: {
      modelo: "z-ai/glm-4.5-air:free",
      apiKey: "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",
      treinamento: "Você é o S.O.S. Bot, assistente virtual da SOS Celular."
    },
    historico: {
      limiteMensagens: 15
    }
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
}

// --- Funções Auxiliares ---
function lerArquivo(arquivo) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch (error) {
    console.error(`Erro ao ler ${arquivo}:`, error);
    return arquivo.includes('produtos') ? [] : {};
  }
}

function salvarArquivo(arquivo, dados) {
  try {
    fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));
    return true;
  } catch (error) {
    console.error(`Erro ao salvar ${arquivo}:`, error);
    return false;
  }
}

// =============================
// ===== ROTAS DE PRODUTOS =====
// =============================

// GET /api/produtos - Listar todos os produtos
app.get('/api/produtos', (req, res) => {
  const produtos = lerArquivo(PRODUTOS_FILE);
  res.json(produtos);
});

// GET /api/produtos/:id - Buscar produto por ID
app.get('/api/produtos/:id', (req, res) => {
  const produtos = lerArquivo(PRODUTOS_FILE);
  const produto = produtos.find(p => p.id == req.params.id);
  
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }
  
  res.json(produto);
});

// POST /api/produtos - Criar novo produto
app.post('/api/produtos', (req, res) => {
  const produtos = lerArquivo(PRODUTOS_FILE);
  const { nome, quantidade, valor } = req.body;

  if (!nome || quantidade === undefined || valor === undefined) {
    return res.status(400).json({ erro: 'Nome, quantidade e valor são obrigatórios' });
  }

  // Gerar novo ID
  const novoId = produtos.length > 0 ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
  
  const novoProduto = {
    id: novoId,
    nome: nome.trim(),
    quantidade: parseInt(quantidade),
    valor: parseFloat(valor)
  };

  produtos.push(novoProduto);
  
  if (salvarArquivo(PRODUTOS_FILE, produtos)) {
    res.status(201).json(novoProduto);
  } else {
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
});

// PUT /api/produtos/:id - Atualizar produto
app.put('/api/produtos/:id', (req, res) => {
  const produtos = lerArquivo(PRODUTOS_FILE);
  const id = parseInt(req.params.id);
  const { nome, quantidade, valor } = req.body;

  const index = produtos.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  if (nome !== undefined) produtos[index].nome = nome.trim();
  if (quantidade !== undefined) produtos[index].quantidade = parseInt(quantidade);
  if (valor !== undefined) produtos[index].valor = parseFloat(valor);

  if (salvarArquivo(PRODUTOS_FILE, produtos)) {
    res.json(produtos[index]);
  } else {
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
});

// DELETE /api/produtos/:id - Remover produto
app.delete('/api/produtos/:id', (req, res) => {
  const produtos = lerArquivo(PRODUTOS_FILE);
  const id = parseInt(req.params.id);

  const index = produtos.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  const produtoRemovido = produtos.splice(index, 1)[0];
  
  if (salvarArquivo(PRODUTOS_FILE, produtos)) {
    res.json({ mensagem: 'Produto removido com sucesso', produto: produtoRemovido });
  } else {
    res.status(500).json({ erro: 'Erro ao remover produto' });
  }
});

// =============================
// ===== ROTAS DE CONFIGURAÇÕES =====
// =============================

// GET /api/config - Buscar configurações
app.get('/api/config', (req, res) => {
  const config = lerArquivo(CONFIG_FILE);
  res.json(config);
});

// PUT /api/config - Atualizar configurações
app.put('/api/config', (req, res) => {
  const { apiKey, modelo, treinamento, limiteMensagens } = req.body;
  
  if (!treinamento && !apiKey && !modelo && !limiteMensagens) {
    return res.status(400).json({ erro: 'Pelo menos um campo deve ser fornecido' });
  }

  const config = lerArquivo(CONFIG_FILE);
  
  // Atualizar campos da IA se fornecidos
  if (apiKey !== undefined) config.ia.apiKey = apiKey;
  if (modelo !== undefined) config.ia.modelo = modelo;
  if (treinamento !== undefined) config.ia.treinamento = treinamento;
  
  // Atualizar limite de mensagens se fornecido
  if (limiteMensagens !== undefined) {
    config.historico.limiteMensagens = parseInt(limiteMensagens);
  }

  if (salvarArquivo(CONFIG_FILE, config)) {
    res.json(config);
  } else {
    res.status(500).json({ erro: 'Erro ao salvar configurações' });
  }
});

// =============================
// ===== ROTAS DE USUÁRIOS =====
// =============================

// GET /api/usuarios - Listar todos os usuários
app.get('/api/usuarios', (req, res) => {
  const usuarios = lerArquivo(USUARIOS_FILE);
  res.json(usuarios);
});

// GET /api/usuarios/:numero - Buscar ou criar usuário
app.get('/api/usuarios/:numero', (req, res) => {
  const usuarios = lerArquivo(USUARIOS_FILE);
  const numero = req.params.numero;
  const { nome = 'Usuario' } = req.query;

  if (usuarios[numero]) {
    usuarios[numero].ultimoContato = new Date().toISOString();
    salvarArquivo(USUARIOS_FILE, usuarios);
    res.json(usuarios[numero]);
  } else {
    const novoUsuario = {
      numero: numero,
      nome: nome,
      pausado: false,
      aceitaMensagens: true,
      primeiroContato: new Date().toISOString(),
      ultimoContato: new Date().toISOString(),
      historico: [],
      tags: []
    };
    usuarios[numero] = novoUsuario;
    salvarArquivo(USUARIOS_FILE, usuarios);
    res.status(201).json(novoUsuario);
  }
});

// GET /api/usuarios/:numero/pode-responder - Verificar se pode responder para o usuário
app.get('/api/usuarios/:numero/pode-responder', (req, res) => {
  const usuarios = lerArquivo(USUARIOS_FILE);
  const numero = req.params.numero;

  if (!usuarios[numero]) {
    return res.json({ podeResponder: true, motivo: 'Usuario novo' });
  }

  const usuario = usuarios[numero];
  const podeResponder = !usuario.pausado && usuario.aceitaMensagens;
  
  let motivo = '';
  if (usuario.pausado) motivo = 'Usuario pausado pelo admin';
  else if (!usuario.aceitaMensagens) motivo = 'Usuario não aceita mensagens de IA';
  else motivo = 'Usuario ativo';

  res.json({ 
    podeResponder, 
    motivo,
    usuario: {
      nome: usuario.nome,
      numero: usuario.numero,
      pausado: usuario.pausado,
      aceitaMensagens: usuario.aceitaMensagens
    }
  });
});

// PUT /api/usuarios/:numero - Atualizar dados do usuário
app.put('/api/usuarios/:numero', (req, res) => {
  const usuarios = lerArquivo(USUARIOS_FILE);
  const numero = req.params.numero;
  const { nome, pausado, aceitaMensagens } = req.body;

  if (!usuarios[numero]) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  if (nome !== undefined) usuarios[numero].nome = nome;
  if (pausado !== undefined) usuarios[numero].pausado = pausado;
  if (aceitaMensagens !== undefined) usuarios[numero].aceitaMensagens = aceitaMensagens;
  
  usuarios[numero].ultimoContato = new Date().toISOString();

  if (salvarArquivo(USUARIOS_FILE, usuarios)) {
    res.json(usuarios[numero]);
  } else {
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
});

// DELETE /api/usuarios/:numero - Remover usuário
app.delete('/api/usuarios/:numero', (req, res) => {
  const usuarios = lerArquivo(USUARIOS_FILE);
  const numero = req.params.numero;

  if (!usuarios[numero]) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  delete usuarios[numero];
  
  if (salvarArquivo(USUARIOS_FILE, usuarios)) {
    res.json({ mensagem: 'Usuário removido com sucesso' });
  } else {
    res.status(500).json({ erro: 'Erro ao remover usuário' });
  }
});

// DELETE /api/usuarios - Limpar todos os usuários (para desenvolvimento)
app.delete('/api/usuarios', (req, res) => {
  console.log('AVISO: Limpando todos os usuários do sistema.');
  
  if (salvarArquivo(USUARIOS_FILE, {})) {
    res.json({ mensagem: 'Todos os usuários foram removidos com sucesso' });
  } else {
    res.status(500).json({ erro: 'Erro ao limpar usuários' });
  }
});

// GET /api/pausados/:numero - Verificar se usuário está pausado (Endpoint de legado)
app.get('/api/pausados/:numero', (req, res) => {
  console.log(`AVISO: A rota legada /api/pausados/:numero foi chamada para o número ${req.params.numero}. Considere atualizar o fluxo para usar GET /api/usuarios/:numero e verificar a propriedade 'pausado'.`);
  const usuarios = lerArquivo(USUARIOS_FILE);
  const numero = req.params.numero;

  if (!usuarios[numero]) {
    // Se o usuário não existe, ele não está pausado.
    return res.json({ pausado: false });
  }

  // Retorna true se pausado for explicitamente true, senão false.
  res.json({ pausado: usuarios[numero].pausado === true });
});

// POST /api/usuarios/:numero/historico - Adicionar mensagem ao histórico
app.post('/api/usuarios/:numero/historico', (req, res) => {
  const usuarios = lerArquivo(USUARIOS_FILE);
  const numero = req.params.numero;
  const { remetente, mensagem } = req.body; // remetente pode ser 'user' ou 'bot'

  // Se o usuário não existir, crie um novo com valores padrão
  if (!usuarios[numero]) {
    console.log(`INFO: Usuário ${numero} não encontrado ao salvar histórico. Criando novo usuário.`);
    usuarios[numero] = {
      numero: numero,
      nome: 'Usuario', // Nome padrão, já que não temos o pushName aqui
      pausado: false,
      aceitaMensagens: true,
      primeiroContato: new Date().toISOString(),
      ultimoContato: new Date().toISOString(),
      historico: [],
      tags: []
    };
  }

  if (!remetente || !mensagem) {
    return res.status(400).json({ erro: 'Remetente e mensagem são obrigatórios' });
  }

  const novaMensagem = {
    remetente,
    mensagem,
    timestamp: new Date().toISOString()
  };

  usuarios[numero].historico.push(novaMensagem);
  usuarios[numero].ultimoContato = new Date().toISOString(); // Atualiza o último contato

  // Manter apenas as últimas N mensagens conforme configuração
  const config = lerArquivo(CONFIG_FILE);
  const limiteMensagens = config.historico?.limiteMensagens || 15;
  while (usuarios[numero].historico.length > limiteMensagens) {
    usuarios[numero].historico.shift();
  }

  if (salvarArquivo(USUARIOS_FILE, usuarios)) {
    res.status(201).json(novaMensagem);
  } else {
    res.status(500).json({ erro: 'Erro ao salvar histórico' });
  }
});

// POST /api/build-ai-payload - Construir payload da IA usando configurações
app.post('/api/build-ai-payload', (req, res) => {
  const { produtos, usuario, mensagem } = req.body;
  
  if (!usuario || !mensagem) {
    return res.status(400).json({ erro: 'Usuário e mensagem são obrigatórios' });
  }

  const config = lerArquivo(CONFIG_FILE);

  const aiPayload = {
    model: config.ia.modelo,
    messages: [
      { role: "system", content: config.ia.treinamento },
      { role: "user", content: mensagem }
    ]
  };

  res.json({
    payload: aiPayload,
    apiKey: config.ia.apiKey
  });
});

// =============================
// ===== ROTAS DO SERVIDOR =====
// =============================

app.get('/', (req, res) => {
  res.redirect('/admin');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    totalProdutos: lerArquivo(PRODUTOS_FILE).length,
    totalUsuarios: Object.keys(lerArquivo(USUARIOS_FILE)).length
  });
});

// =============================
// ===== INICIAR SERVIDOR =====
// =============================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔗 API Produtos: http://localhost:${PORT}/api/produtos`);
  console.log(`👤 API Usuários: http://localhost:${PORT}/api/usuarios`);
});