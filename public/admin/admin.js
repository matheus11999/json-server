// Configuração da API
const API_BASE = window.location.origin;

// Estado global
let produtos = [];
let usuarios = [];
let authToken = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se há token salvo
    authToken = localStorage.getItem('admin_token');
    
    if (authToken) {
        mostrarPainelPrincipal();
    } else {
        mostrarTelaLogin();
    }
    
    // Event listener para o formulário de login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await realizarLogin();
    });
    
    // Event listener para o formulário de produto
    document.getElementById('produtoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('produtoId').value;
        const nome = document.getElementById('produtoNome').value;
        const quantidade = parseInt(document.getElementById('produtoQuantidade').value);
        const valor = parseFloat(document.getElementById('produtoValor').value);
        
        const dadosProduto = { nome, quantidade, valor };
        
        try {
            let response;
            if (id) {
                // Editar produto existente
                response = await fetchAuth(`${API_BASE}/api/produtos/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(dadosProduto)
                });
            } else {
                // Criar novo produto
                response = await fetchAuth(`${API_BASE}/api/produtos`, {
                    method: 'POST',
                    body: JSON.stringify(dadosProduto)
                });
            }
            
            if (response.ok) {
                showAlert(id ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
                fecharFormularioProduto();
                carregarProdutos();
                carregarStatus();
            } else {
                const error = await response.json();
                showAlert(error.erro || 'Erro ao salvar produto', 'error');
            }
        } catch (error) {
            showAlert('Erro ao salvar produto', 'error');
            console.error('Erro:', error);
        }
    });
});

// === AUTENTICAÇÃO ===

function mostrarTelaLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-panel').style.display = 'none';
}

function mostrarPainelPrincipal() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-panel').style.display = 'block';
    
    // Carregar dados
    carregarStatus();
    carregarProdutos();
    carregarUsuarios();
    carregarConfiguracoes();
}

async function realizarLogin() {
    const password = document.getElementById('password').value;
    const loginAlert = document.getElementById('login-alert');
    
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('admin_token', authToken);
            mostrarPainelPrincipal();
            loginAlert.style.display = 'none';
        } else {
            loginAlert.className = 'alert error';
            loginAlert.textContent = data.erro || 'Erro ao fazer login';
            loginAlert.style.display = 'block';
        }
    } catch (error) {
        loginAlert.className = 'alert error';
        loginAlert.textContent = 'Erro de conexão. Tente novamente.';
        loginAlert.style.display = 'block';
        console.error('Erro no login:', error);
    }
}

function logout() {
    authToken = null;
    localStorage.removeItem('admin_token');
    mostrarTelaLogin();
    document.getElementById('password').value = '';
}

// Função para fazer requisições autenticadas
async function fetchAuth(url, options = {}) {
    if (!authToken) {
        throw new Error('Token de autenticação não encontrado');
    }
    
    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        logout();
        throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    return response;
}

// Funções auxiliares
function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[onclick="showTab('${tab}')"]`).classList.add('active');
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${tab}-section`).classList.add('active');
    
    if (tab === 'produtos') {
        carregarProdutos();
    } else if (tab === 'usuarios') {
        carregarUsuarios();
    } else if (tab === 'configuracoes') {
        carregarConfiguracoes();
    }
}

function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

function formatarData(isoString) {
    if (!isoString) return '-';
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR');
}

// Status do sistema
async function carregarStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        document.getElementById('status-text').textContent = 
            `✅ Online - ${data.totalProdutos} produtos, ${data.totalUsuarios} usuários`;
            
        document.getElementById('total-produtos').textContent = data.totalProdutos;
        document.getElementById('total-usuarios').textContent = data.totalUsuarios;
    } catch (error) {
        document.getElementById('status-text').textContent = '❌ Offline';
        console.error('Erro ao carregar status:', error);
    }
}

// === PRODUTOS ===

async function carregarProdutos() {
    try {
        const response = await fetchAuth(`${API_BASE}/api/produtos`);
        produtos = await response.json();
        renderizarProdutos();
    } catch (error) {
        showAlert('Erro ao carregar produtos', 'error');
        console.error('Erro ao carregar produtos:', error);
    }
}

function renderizarProdutos() {
    const tbody = document.getElementById('produtos-lista');
    
    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum produto cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = produtos.map(produto => `
        <tr>
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>${produto.quantidade}</td>
            <td>R$ ${produto.valor.toFixed(2)}</td>
            <td>
                <button class="btn btn-warning" onclick="editarProduto(${produto.id})" style="margin-right: 5px;">
                    Editar
                </button>
                <button class="btn btn-danger" onclick="removerProduto(${produto.id})">
                    Remover
                </button>
            </td>
        </tr>
    `).join('');
}

// === USUÁRIOS ===

async function carregarUsuarios() {
    try {
        const response = await fetchAuth(`${API_BASE}/api/usuarios`);
        const data = await response.json();
        usuarios = Object.values(data); // Converter objeto em array
        renderizarUsuarios();
    } catch (error) {
        showAlert('Erro ao carregar usuários', 'error');
        console.error('Erro ao carregar usuários:', error);
    }
}

function renderizarUsuarios() {
    const tbody = document.getElementById('usuarios-lista');
    
    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum usuário encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = usuarios.sort((a, b) => new Date(b.ultimoContato) - new Date(a.ultimoContato)).map(usuario => `
        <tr>
            <td><strong>${usuario.nome}</strong><br><small>${usuario.numero}</small></td>
            <td>${formatarData(usuario.ultimoContato)}</td>
            <td>
                <span class="status-badge ${usuario.pausado ? 'paused' : 'active'}">
                    ${usuario.pausado ? 'Pausado' : 'Ativo'}
                </span>
            </td>
            <td>
                <label class="switch">
                    <input type="checkbox" ${!usuario.pausado ? 'checked' : ''} onchange="togglePausado('${usuario.numero}', this.checked)">
                    <span class="slider round"></span>
                </label>
            </td>
            <td>
                <label class="switch">
                    <input type="checkbox" ${usuario.aceitaMensagens ? 'checked' : ''} onchange="toggleNotificacoes('${usuario.numero}', this.checked)">
                    <span class="slider round"></span>
                </label>
            </td>
            <td>
                <button class="btn btn-info" onclick="verHistorico('${usuario.numero}')" style="margin-right: 5px;">
                    Ver Histórico
                </button>
                <button class="btn btn-warning" onclick="limparHistorico('${usuario.numero}')">
                    Limpar Histórico
                </button>
            </td>
            <td>
                <button class="btn btn-danger" onclick="removerUsuario('${usuario.numero}')">
                    Remover
                </button>
            </td>
        </tr>
    `).join('');
}

async function togglePausado(numero, estaAtivo) {
    const novoStatusPausado = !estaAtivo;
    
    try {
        const response = await fetchAuth(`${API_BASE}/api/usuarios/${numero}`, {
            method: 'PUT',
            body: JSON.stringify({ pausado: novoStatusPausado })
        });
        
        if (response.ok) {
            showAlert(`Bot ${novoStatusPausado ? 'pausado' : 'reativado'} para o usuário!`);
            const user = usuarios.find(u => u.numero === numero);
            if(user) user.pausado = novoStatusPausado;
            renderizarUsuarios();
        } else {
            showAlert('Erro ao atualizar status do bot', 'error');
        }
    } catch (error) {
        showAlert('Erro ao atualizar status do bot', 'error');
        console.error('Erro:', error);
    }
}

async function toggleNotificacoes(numero, aceitaMensagens) {
    try {
        const response = await fetchAuth(`${API_BASE}/api/usuarios/${numero}`, {
            method: 'PUT',
            body: JSON.stringify({ aceitaMensagens })
        });
        
        if (response.ok) {
            showAlert(`Notificações ${aceitaMensagens ? 'ativadas' : 'desativadas'} para o usuário!`);
            const user = usuarios.find(u => u.numero === numero);
            if(user) user.aceitaMensagens = aceitaMensagens;
            renderizarUsuarios();
        } else {
            showAlert('Erro ao atualizar notificações', 'error');
        }
    } catch (error) {
        showAlert('Erro ao atualizar notificações', 'error');
        console.error('Erro:', error);
    }
}

async function removerUsuario(numero) {
    if (!confirm(`Tem certeza que deseja remover o usuário ${numero}? Esta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const response = await fetchAuth(`${API_BASE}/api/usuarios/${numero}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Usuário removido com sucesso!');
            carregarUsuarios();
            carregarStatus();
        } else {
            const error = await response.json();
            showAlert(error.erro || 'Erro ao remover usuário', 'error');
        }
    } catch (error) {
        showAlert('Erro ao remover usuário', 'error');
        console.error('Erro:', error);
    }
}

// === HISTÓRICO ===

async function limparHistorico(numero) {
    const usuario = usuarios.find(u => u.numero === numero);
    if (!usuario) {
        showAlert('Usuário não encontrado', 'error');
        return;
    }
    
    if (!confirm(`Tem certeza que deseja limpar todo o histórico de ${usuario.nome}? Esta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const response = await fetchAuth(`${API_BASE}/api/usuarios/${numero}/historico`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Histórico limpo com sucesso!');
            // Atualizar o usuário local
            const user = usuarios.find(u => u.numero === numero);
            if(user) user.historico = [];
            carregarUsuarios();
        } else {
            const error = await response.json();
            showAlert(error.erro || 'Erro ao limpar histórico', 'error');
        }
    } catch (error) {
        showAlert('Erro ao limpar histórico', 'error');
        console.error('Erro:', error);
    }
}

async function verHistorico(numero) {
    const usuario = usuarios.find(u => u.numero === numero);
    if (!usuario) {
        showAlert('Usuário não encontrado para carregar o histórico.', 'error');
        return;
    }
    
    document.getElementById('historicoTitulo').textContent = `Histórico de ${usuario.nome} (${numero})`;
    const conteudo = document.getElementById('historicoConteudo');
    
    if (!usuario.historico || usuario.historico.length === 0) {
        conteudo.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma mensagem no histórico</p>';
    } else {
        conteudo.innerHTML = usuario.historico.map(msg => `
            <div class="historico-item ${msg.remetente === 'user' ? 'historico-user' : 'historico-bot'}">
                <strong>${msg.remetente === 'user' ? 'Usuário' : 'Bot'}:</strong> ${msg.mensagem}
                <br><small>${formatarData(msg.timestamp)}</small>
            </div>
        `).join('');
    }
    
    document.getElementById('historicoModal').style.display = 'block';
}

function fecharHistorico() {
    document.getElementById('historicoModal').style.display = 'none';
}

// === PRODUTOS CRUD ===

function mostrarFormularioProduto(produto = null) {
    document.getElementById('produtoTitulo').textContent = produto ? 'Editar Produto' : 'Adicionar Produto';
    
    if (produto) {
        document.getElementById('produtoId').value = produto.id;
        document.getElementById('produtoNome').value = produto.nome;
        document.getElementById('produtoQuantidade').value = produto.quantidade;
        document.getElementById('produtoValor').value = produto.valor;
    } else {
        document.getElementById('produtoId').value = '';
        document.getElementById('produtoForm').reset();
    }
    
    document.getElementById('produtoModal').style.display = 'block';
}

function fecharFormularioProduto() {
    document.getElementById('produtoModal').style.display = 'none';
    document.getElementById('produtoForm').reset();
}

async function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        mostrarFormularioProduto(produto);
    }
}

async function removerProduto(id) {
    if (!confirm('Tem certeza que deseja remover este produto?')) {
        return;
    }
    
    try {
        const response = await fetchAuth(`${API_BASE}/api/produtos/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Produto removido com sucesso!');
            carregarProdutos();
            carregarStatus();
        } else {
            const error = await response.json();
            showAlert(error.erro || 'Erro ao remover produto', 'error');
        }
    } catch (error) {
        showAlert('Erro ao remover produto', 'error');
        console.error('Erro:', error);
    }
}


// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    const historicoModal = document.getElementById('historicoModal');
    const produtoModal = document.getElementById('produtoModal');
    
    if (event.target == historicoModal) {
        historicoModal.style.display = 'none';
    }
    if (event.target == produtoModal) {
        produtoModal.style.display = 'none';
    }
}

// === CONFIGURAÇÕES ===

async function carregarConfiguracoes() {
    try {
        const response = await fetchAuth(`${API_BASE}/api/config`);
        const config = await response.json();
        
        document.getElementById('apiKey').value = config.ia?.apiKey || '';
        document.getElementById('modelo').value = config.ia?.modelo || '';
        document.getElementById('limiteMensagens').value = config.historico?.limiteMensagens || 15;
        document.getElementById('treinamentoIA').value = config.ia?.treinamento || '';
    } catch (error) {
        showAlert('Erro ao carregar configurações', 'error');
        console.error('Erro ao carregar configurações:', error);
    }
}

async function salvarConfiguracoes() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const limiteMensagens = parseInt(document.getElementById('limiteMensagens').value);
    const treinamento = document.getElementById('treinamentoIA').value.trim();
    
    if (!treinamento) {
        showAlert('O treinamento da IA não pode estar vazio', 'error');
        return;
    }
    
    if (!apiKey) {
        showAlert('A API Key não pode estar vazia', 'error');
        return;
    }
    
    if (!modelo) {
        showAlert('O modelo da IA não pode estar vazio', 'error');
        return;
    }
    
    if (isNaN(limiteMensagens) || limiteMensagens < 5 || limiteMensagens > 50) {
        showAlert('O limite de mensagens deve ser entre 5 e 50', 'error');
        return;
    }

    try {
        const response = await fetchAuth(`${API_BASE}/api/config`, {
            method: 'PUT',
            body: JSON.stringify({ 
                apiKey, 
                modelo, 
                limiteMensagens, 
                treinamento 
            })
        });
        
        if (response.ok) {
            showAlert('Configurações salvas com sucesso!');
        } else {
            const error = await response.json();
            showAlert(error.erro || 'Erro ao salvar configurações', 'error');
        }
    } catch (error) {
        showAlert('Erro ao salvar configurações', 'error');
        console.error('Erro:', error);
    }
}

// Atualizar dados a cada 30 segundos
setInterval(() => {
    carregarStatus();
    if (document.getElementById('usuarios-section').classList.contains('active')) {
        carregarUsuarios();
    }
}, 30000);
