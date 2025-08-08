// Configuração da API
const API_BASE = window.location.origin;

// Estado global
let produtos = [];
let usuarios = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarStatus();
    carregarProdutos();
    carregarUsuarios();
});

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
        const response = await fetch(`${API_BASE}/api/produtos`);
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
        </tr>
    `).join('');
}

// === USUÁRIOS ===

async function carregarUsuarios() {
    try {
        const response = await fetch(`${API_BASE}/api/usuarios`);
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
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum usuário encontrado</td></tr>';
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
                    <input type="checkbox" ${!usuario.pausado ? 'checked' : ''} onchange="togglePausado('${usuario.numero}', ${!usuario.pausado})">
                    <span class="slider round"></span>
                </label>
            </td>
        </tr>
    `).join('');
}

async function togglePausado(numero, estaAtivo) {
    const novoStatusPausado = !estaAtivo;
    
    try {
        const response = await fetch(`${API_BASE}/api/usuarios/${numero}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pausado: novoStatusPausado })
        });
        
        if (response.ok) {
            showAlert(`Usuário ${novoStatusPausado ? 'pausado' : 'reativado'} com sucesso!`);
            carregarUsuarios();
            carregarStatus();
        } else {
            showAlert('Erro ao atualizar status do usuário', 'error');
        }
    } catch (error) {
        showAlert('Erro ao atualizar status do usuário', 'error');
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
