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

// --- Inicialização ---
if (!fs.existsSync(PRODUTOS_FILE)) {
  fs.writeFileSync(PRODUTOS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(USUARIOS_FILE)) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify({}, null, 2));
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

  // Manter apenas as últimas 15 mensagens
  if (usuarios[numero].historico.length > 15) {
    usuarios[numero].historico.shift();
  }

  if (salvarArquivo(USUARIOS_FILE, usuarios)) {
    res.status(201).json(novaMensagem);
  } else {
    res.status(500).json({ erro: 'Erro ao salvar histórico' });
  }
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