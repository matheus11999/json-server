// Configuração da API
const API_BASE = window.location.origin;

// Estado global
let produtos = [];
let pausados = {};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarStatus();
    carregarProdutos();
    carregarPausados();
});

// Funções auxiliares
function showTab(tab) {
    // Atualizar tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[onclick="showTab('${tab}')"]`).classList.add('active');
    
    // Atualizar conteúdo
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${tab}-section`).classList.add('active');
    
    // Recarregar dados
    if (tab === 'produtos') {
        carregarProdutos();
    } else if (tab === 'pausados') {
        carregarPausados();
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
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR');
}

// Status do sistema
async function carregarStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        document.getElementById('status-text').textContent = 
            `✅ Online - ${data.produtos} produtos, ${data.pausados} usuários pausados`;
            
        document.getElementById('total-produtos').textContent = data.produtos;
        document.getElementById('total-pausados').textContent = data.pausados;
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
            <td>
                <input type="text" value="${produto.nome}" 
                       onblur="atualizarProduto(${produto.id}, 'nome', this.value)"
                       style="border: none; background: transparent; width: 100%;">
            </td>
            <td>
                <input type="number" value="${produto.quantidade}" 
                       onblur="atualizarProduto(${produto.id}, 'quantidade', this.value)"
                       style="border: none; background: transparent; width: 80px;">
            </td>
            <td>
                R$ <input type="number" value="${produto.valor}" step="0.01"
                         onblur="atualizarProduto(${produto.id}, 'valor', this.value)"
                         style="border: none; background: transparent; width: 80px;">
            </td>
            <td>
                <button class="btn btn-danger" onclick="removerProduto(${produto.id})">
                    🗑️ Remover
                </button>
            </td>
        </tr>
    `).join('');
}

async function adicionarProduto() {
    const nome = document.getElementById('produto-nome').value.trim();
    const quantidade = parseInt(document.getElementById('produto-quantidade').value);
    const valor = parseFloat(document.getElementById('produto-valor').value);
    
    if (!nome || isNaN(quantidade) || isNaN(valor)) {
        showAlert('Preencha todos os campos corretamente', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, quantidade, valor })
        });
        
        if (response.ok) {
            showAlert('Produto adicionado com sucesso!');
            document.getElementById('produto-nome').value = '';
            document.getElementById('produto-quantidade').value = '';
            document.getElementById('produto-valor').value = '';
            carregarProdutos();
            carregarStatus();
        } else {
            const error = await response.json();
            showAlert(error.erro || 'Erro ao adicionar produto', 'error');
        }
    } catch (error) {
        showAlert('Erro ao adicionar produto', 'error');
        console.error('Erro:', error);
    }
}

async function atualizarProduto(id, campo, valor) {
    if (valor.trim() === '') return;
    
    const dados = {};
    dados[campo] = campo === 'nome' ? valor : parseFloat(valor) || parseInt(valor);
    
    try {
        const response = await fetch(`${API_BASE}/api/produtos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        if (response.ok) {
            showAlert('Produto atualizado!');
            carregarProdutos();
        } else {
            showAlert('Erro ao atualizar produto', 'error');
        }
    } catch (error) {
        showAlert('Erro ao atualizar produto', 'error');
        console.error('Erro:', error);
    }
}

async function removerProduto(id) {
    if (!confirm('Tem certeza que deseja remover este produto?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/produtos/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Produto removido com sucesso!');
            carregarProdutos();
            carregarStatus();
        } else {
            showAlert('Erro ao remover produto', 'error');
        }
    } catch (error) {
        showAlert('Erro ao remover produto', 'error');
        console.error('Erro:', error);
    }
}

// === USUÁRIOS PAUSADOS ===

async function carregarPausados() {
    try {
        const response = await fetch(`${API_BASE}/api/pausados`);
        pausados = await response.json();
        renderizarPausados();
    } catch (error) {
        showAlert('Erro ao carregar usuários pausados', 'error');
        console.error('Erro ao carregar pausados:', error);
    }
}

function renderizarPausados() {
    const tbody = document.getElementById('pausados-lista');
    const pausadosList = Object.values(pausados);
    
    if (pausadosList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum usuário pausado</td></tr>';
        return;
    }
    
    tbody.innerHTML = pausadosList.map(pausado => `
        <tr>
            <td>
                <strong>${pausado.numero}</strong>
                <br><small style="color: #666;">+${pausado.numero}</small>
            </td>
            <td>${pausado.motivo || 'Sem motivo especificado'}</td>
            <td>${formatarData(pausado.pausadoEm)}</td>
            <td>
                <button class="btn" onclick="reativarUsuario('${pausado.numero}')">
                    ▶️ Reativar
                </button>
            </td>
        </tr>
    `).join('');
}

async function pausarUsuario() {
    const numero = document.getElementById('pausar-numero').value.trim();
    const motivo = document.getElementById('pausar-motivo').value.trim();
    
    if (!numero) {
        showAlert('Informe o número do usuário', 'error');
        return;
    }
    
    // Validar formato do número (básico)
    if (!/^\d{10,15}$/.test(numero)) {
        showAlert('Número deve conter apenas dígitos (10-15 caracteres)', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/pausados`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                numero, 
                motivo: motivo || 'Pausado manualmente pelo admin'
            })
        });
        
        if (response.ok) {
            showAlert('Usuário pausado com sucesso!');
            document.getElementById('pausar-numero').value = '';
            document.getElementById('pausar-motivo').value = '';
            carregarPausados();
            carregarStatus();
        } else {
            const error = await response.json();
            showAlert(error.erro || 'Erro ao pausar usuário', 'error');
        }
    } catch (error) {
        showAlert('Erro ao pausar usuário', 'error');
        console.error('Erro:', error);
    }
}

async function reativarUsuario(numero) {
    if (!confirm(`Tem certeza que deseja reativar o usuário ${numero}?`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/pausados/${numero}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Usuário reativado com sucesso!');
            carregarPausados();
            carregarStatus();
        } else {
            showAlert('Erro ao reativar usuário', 'error');
        }
    } catch (error) {
        showAlert('Erro ao reativar usuário', 'error');
        console.error('Erro:', error);
    }
}

// Atualizar status a cada 30 segundos
setInterval(carregarStatus, 30000);