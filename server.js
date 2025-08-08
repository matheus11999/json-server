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

// Arquivos de dados
const PRODUTOS_FILE = path.join(__dirname, 'data', 'produtos.json');
const PAUSADOS_FILE = path.join(__dirname, 'data', 'pausados.json');

// Criar diretório data se não existir
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Inicializar arquivos se não existirem
if (!fs.existsSync(PRODUTOS_FILE)) {
  fs.writeFileSync(PRODUTOS_FILE, JSON.stringify([
    { "id": 1, "nome": "Tela A20s", "quantidade": 10, "valor": 200 },
    { "id": 2, "nome": "Bateria J7", "quantidade": 5, "valor": 120 }
  ], null, 2));
}

if (!fs.existsSync(PAUSADOS_FILE)) {
  fs.writeFileSync(PAUSADOS_FILE, JSON.stringify({}, null, 2));
}

// Funções auxiliares
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

// ===== ROTAS PRODUTOS =====

// GET /api/produtos - Listar todos os produtos
app.get('/api/produtos', (req, res) => {
  const produtos = lerArquivo(PRODUTOS_FILE);
  res.json(produtos);
});

// GET /api/produtos/:id - Buscar produto por ID
app.get('/api/produtos/:id', (req, res) => {
  const produtos = lerArquivo(PRODUTOS_FILE);
  const produto = produtos.find(p => p.id === parseInt(req.params.id));
  
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }
  
  res.json(produto);
});

// POST /api/produtos - Criar novo produto
app.post('/api/produtos', (req, res) => {
  const { nome, quantidade, valor } = req.body;
  
  if (!nome || quantidade === undefined || valor === undefined) {
    return res.status(400).json({ erro: 'Nome, quantidade e valor são obrigatórios' });
  }
  
  const produtos = lerArquivo(PRODUTOS_FILE);
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
    res.status(500).json({ erro: 'Erro ao salvar produto' });
  }
});

// PUT /api/produtos/:id - Atualizar produto
app.put('/api/produtos/:id', (req, res) => {
  const { nome, quantidade, valor } = req.body;
  const produtos = lerArquivo(PRODUTOS_FILE);
  const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
  
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

// DELETE /api/produtos/:id - Deletar produto
app.delete('/api/produtos/:id', (req, res) => {
  const produtos = lerArquivo(PRODUTOS_FILE);
  const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
  
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

// ===== ROTAS USUÁRIOS PAUSADOS =====

// GET /api/pausados - Listar todos os usuários pausados
app.get('/api/pausados', (req, res) => {
  const pausados = lerArquivo(PAUSADOS_FILE);
  res.json(pausados);
});

// GET /api/pausados/:numero - Verificar se usuário está pausado
app.get('/api/pausados/:numero', (req, res) => {
  const pausados = lerArquivo(PAUSADOS_FILE);
  const numero = req.params.numero;
  
  if (pausados[numero]) {
    res.json({ pausado: true, dados: pausados[numero] });
  } else {
    res.json({ pausado: false });
  }
});

// POST /api/pausados - Pausar usuário
app.post('/api/pausados', (req, res) => {
  const { numero, motivo = 'Pausado manualmente' } = req.body;
  
  if (!numero) {
    return res.status(400).json({ erro: 'Número é obrigatório' });
  }
  
  const pausados = lerArquivo(PAUSADOS_FILE);
  
  pausados[numero] = {
    numero: numero,
    motivo: motivo,
    pausadoEm: new Date().toISOString(),
    pausadoPor: 'admin'
  };
  
  if (salvarArquivo(PAUSADOS_FILE, pausados)) {
    res.status(201).json({ mensagem: 'Usuário pausado com sucesso', dados: pausados[numero] });
  } else {
    res.status(500).json({ erro: 'Erro ao pausar usuário' });
  }
});

// DELETE /api/pausados/:numero - Reativar usuário
app.delete('/api/pausados/:numero', (req, res) => {
  const numero = req.params.numero;
  const pausados = lerArquivo(PAUSADOS_FILE);
  
  if (!pausados[numero]) {
    return res.status(404).json({ erro: 'Usuário não está pausado' });
  }
  
  const dadosUsuario = pausados[numero];
  delete pausados[numero];
  
  if (salvarArquivo(PAUSADOS_FILE, pausados)) {
    res.json({ mensagem: 'Usuário reativado com sucesso', dadosAnteriores: dadosUsuario });
  } else {
    res.status(500).json({ erro: 'Erro ao reativar usuário' });
  }
});

// ===== ROTAS ESPECIAIS PARA N8N =====

// GET /produtos - Compatibilidade com jsonkeeper (para n8n)
app.get('/produtos', (req, res) => {
  const produtos = lerArquivo(PRODUTOS_FILE);
  res.json(produtos);
});

// GET /pausados - Compatibilidade simples (para n8n)
app.get('/pausados', (req, res) => {
  const pausados = lerArquivo(PAUSADOS_FILE);
  res.json(pausados);
});

// ===== ROTA PRINCIPAL =====
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// ===== ROTA DE STATUS =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    produtos: lerArquivo(PRODUTOS_FILE).length,
    pausados: Object.keys(lerArquivo(PAUSADOS_FILE)).length
  });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Admin: http://localhost:${PORT}/admin`);
  console.log(`🔗 API Produtos: http://localhost:${PORT}/api/produtos`);
  console.log(`⏸️  API Pausados: http://localhost:${PORT}/api/pausados`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Servidor sendo encerrado...');
  process.exit(0);
});