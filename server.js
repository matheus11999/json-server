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
const DATA_DIR = path.join(__dirname, 'data');
const PRODUTOS_FILE = path.join(DATA_DIR, 'produtos.json');
const USUARIOS_FILE = path.join(DATA_DIR, 'usuarios.json');

// --- Inicialização ---
// Criar diretório 'data' se não existir
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Inicializar arquivo de produtos se não existir
if (!fs.existsSync(PRODUTOS_FILE)) {
  fs.writeFileSync(PRODUTOS_FILE, JSON.stringify([
    { "id": 1, "nome": "Tela A20s", "quantidade": 10, "valor": 200 },
    { "id": 2, "nome": "Bateria J7", "quantidade": 5, "valor": 120 },
    { "id": 3, "nome": "frontal a50", "quantidade": 1, "valor": 180 }
  ], null, 2));
}

// Inicializar arquivo de usuários se não existir
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
  const { nome = 'Usuario' } = req.query; // Pega o nome da query string, se houver

  if (usuarios[numero]) {
    // Usuário existe, atualiza o último contato e retorna
    usuarios[numero].ultimoContato = new Date().toISOString();
    salvarArquivo(USUARIOS_FILE, usuarios);
    res.json(usuarios[numero]);
  } else {
    // Usuário não existe, cria um novo
    const novoUsuario = {
      numero: numero,
      nome: nome,
      pausado: false,
      aceitaMensagens: true,
      primeiroContato: new Date().toISOString(),
      ultimoContato: new Date().toISOString(),
      tags: []
    };
    usuarios[numero] = novoUsuario;
    salvarArquivo(USUARIOS_FILE, usuarios);
    res.status(201).json(novoUsuario); // 201 Created
  }
});

// PUT /api/usuarios/:numero - Atualizar dados do usuário
app.put('/api/usuarios/:numero', (req, res) => {
  const usuarios = lerArquivo(USUARIOS_FILE);
  const numero = req.params.numero;
  const { nome, pausado, aceitaMensagens } = req.body;

  if (!usuarios[numero]) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  // Atualiza os campos fornecidos
  if (nome !== undefined) {
    usuarios[numero].nome = nome;
  }
  if (pausado !== undefined) {
    usuarios[numero].pausado = pausado;
  }
  if (aceitaMensagens !== undefined) {
    usuarios[numero].aceitaMensagens = aceitaMensagens;
  }
  
  usuarios[numero].ultimoContato = new Date().toISOString();

  if (salvarArquivo(USUARIOS_FILE, usuarios)) {
    res.json(usuarios[numero]);
  } else {
    res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
});


// =============================
// ===== ROTAS LEGADAS (N8N) =====
// =============================

// GET /produtos - Compatibilidade para o n8n não quebrar
app.get('/produtos', (req, res) => {
  const produtos = lerArquivo(PRODUTOS_FILE);
  res.json(produtos);
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
