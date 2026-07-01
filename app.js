/* ========================================
   CALCULADORAS INDUSTRIAIS — app.js
   ======================================== */

'use strict';

/* ========================================
   SENHA ADMINISTRATIVA
   (Altere somente aqui, em um único lugar)
   ======================================== */
const SENHA_ADMIN = "M@lima1980";

/* ========================================
   TABELAS EDITÁVEIS
   ======================================== */

/**
 * Produtividade de cada malha em m² por hora.
 * Fórmula: horasFabricacao = areaTotalM2 / producaoM2h[malha]
 *
 *
 * Validações:
 *   Malha 2,5 → 4,33 m²/h  → 4,33 m² = 1h | 43,3  m² = 10h | 86,6  m² = 20h
 *   Malha 5   → 8,67 m²/h  → 8,67 m² = 1h | 86,7  m² = 10h | 173,4 m² = 20h
 *   Malha 8   → 13,00 m²/h → 13    m² = 1h | 130   m² = 10h | 260   m² = 20h
 *   Malha 10  → 17,33 m²/h → 17,33 m² = 1h | 173,3 m² = 10h | 346,6 m² = 20h
 */
let producaoM2h = {};

let csvFileHandle = null;

/* ========================================
   UTILITÁRIOS
   ======================================== */

/** Converte string com vírgula ou ponto para float */
function parseNum(str) {
  if (str === undefined || str === null || str === '') return NaN;
  return parseFloat(String(str).replace(',', '.'));
}

/** Formata número com N casas decimais, usando vírgula brasileira */
function fmt(n, dec = 2) {
  if (isNaN(n) || n === null) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/** Formata horas decimais para H:MM (minutos ≤ 59) */
function fmtHoras(n) {
  if (isNaN(n) || n === null) return '—';
  const h = Math.floor(n);
  const m = Math.floor((n - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

/** Formata número inteiro (arredonda para cima) */
function fmtInt(n) {
  if (isNaN(n) || n === null) return '—';
  return Math.ceil(n).toLocaleString('pt-BR');
}

/** Exibe ou oculta mensagem de erro */
function setErro(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  if (msg) {
    el.textContent = '⚠ ' + msg;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
    el.textContent = '';
  }
}

/** Define texto de um elemento por ID */
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ========================================
   NAVEGAÇÃO ENTRE TELAS
   ======================================== */

function trocarTela(tela) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  document.querySelectorAll('.btn-menu').forEach(b => b.classList.remove('ativo'));

  switch (tela) {
    case 'producao':
      document.getElementById('tela-producao').classList.add('ativa');
      document.getElementById('menu-producao').classList.add('ativo');
      break;
    case 'conversor':
      document.getElementById('tela-conversor').classList.add('ativa');
      document.getElementById('menu-conversor').classList.add('ativo');
      break;
    default:
      console.warn('Tela desconhecida:', tela);
  }

  salvarEstado();
}

/* ========================================
   TEMA CLARO / ESCURO
   ======================================== */

function alternarTema() {
  const body = document.body;
  const escuro = body.classList.toggle('tema-escuro');
  body.classList.toggle('tema-claro', !escuro);
  document.getElementById('iconeTema').textContent = escuro ? '☀️' : '🌙';
  localStorage.setItem('calc-tema', escuro ? 'escuro' : 'claro');
}

function carregarTema() {
  const tema = localStorage.getItem('calc-tema') || 'claro';
  const body = document.body;
  if (tema === 'escuro') {
    body.classList.add('tema-escuro');
    body.classList.remove('tema-claro');
    document.getElementById('iconeTema').textContent = '☀️';
  } else {
    body.classList.add('tema-claro');
    body.classList.remove('tema-escuro');
    document.getElementById('iconeTema').textContent = '🌙';
  }
}

/* ========================================
   TELA 1 — PRAZO DE PRODUÇÃO
   ======================================== */

function calcularProducao() {
  const malha       = parseNum(document.getElementById('prod-malha').value);
  const comprimento = parseNum(document.getElementById('prod-comprimento').value);
  const altura      = parseNum(document.getElementById('prod-altura').value);
  const quantidade  = parseNum(document.getElementById('prod-quantidade').value);
  const diasFila    = parseNum(document.getElementById('prod-dias-fila').value);

  if (isNaN(comprimento) || comprimento <= 0) {
    setErro('erro-producao', 'Informe o comprimento em metros.');
    limparResultadosProducao(); return;
  }
  if (isNaN(altura) || altura <= 0) {
    setErro('erro-producao', 'Informe a altura em metros.');
    limparResultadosProducao(); return;
  }
  if (isNaN(quantidade) || quantidade <= 0) {
    setErro('erro-producao', 'Informe a quantidade.');
    limparResultadosProducao(); return;
  }
  setErro('erro-producao', '');

  const areaTotalM2      = comprimento * altura * quantidade;
  const metroLinear      = comprimento * quantidade;
  // Produtividade da malha selecionada (m²/hora)
  const prodPorHora      = producaoM2h[malha] ?? null;

  if (!prodPorHora) {
    setErro('erro-producao', 'Malha sem produtividade cadastrada. Desbloqueie as configurações para ajustar.');
    limparResultadosProducao(); return;
  }

  // FÓRMULA CENTRAL: horas = área total ÷ produção por hora
  const horasFabricacao  = areaTotalM2 / prodPorHora;
  // Dias: arredonda para cima, jornada de 8h/dia
  const diasFabricacao   = Math.ceil(horasFabricacao / 8);
  const previsaoEntrega  = Math.ceil(diasFabricacao * 1.12) + (isNaN(diasFila) ? 0 : Math.ceil(diasFila));

  setVal('res-metro-linear', fmt(metroLinear, 2));
  setVal('res-m2-total',     fmt(areaTotalM2, 2));
  setVal('res-horas-fab',    fmtHoras(horasFabricacao));
  setVal('res-dias-fab',     fmtInt(diasFabricacao));
  setVal('res-previsao',     fmtInt(previsaoEntrega));

  salvarEstado();
}

function limparResultadosProducao() {
  ['res-metro-linear','res-m2-total','res-horas-fab','res-dias-fab','res-previsao']
    .forEach(id => setVal(id, '—'));
}

function limparProducao() {
  ['prod-comprimento','prod-altura','prod-quantidade','prod-dias-fila']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('prod-malha').value = '2.5';
  limparResultadosProducao();
  setErro('erro-producao', '');
  salvarEstado();
}

/* ========================================
   TABELA DE PRODUTIVIDADE — ÁREA PROTEGIDA
   ======================================== */

/** Estado de desbloqueio: NUNCA salvo no localStorage, sempre false ao carregar */
let areaDesbloqueada = false;

function desbloquearConfiguracoes() {
  const senha = prompt('Digite a senha para desbloquear as configurações:');
  if (senha === null) return; // cancelou

  if (senha === SENHA_ADMIN) {
    areaDesbloqueada = true;
    mostrarAreaAdmin();
  } else {
    alert('Senha incorreta. Acesso negado.');
  }
}

function mostrarAreaAdmin() {
  const area     = document.getElementById('area-admin');
  const btnDesbloq = document.getElementById('btn-desbloquear');
  const btnBloquear = document.getElementById('btn-bloquear');

  if (areaDesbloqueada) {
    area.classList.remove('hidden');
    btnDesbloq.classList.add('hidden');
    btnBloquear.classList.remove('hidden');
    renderizarTabelaProducao();
  } else {
    area.classList.add('hidden');
    btnDesbloq.classList.remove('hidden');
    btnBloquear.classList.add('hidden');
  }
}

function bloquearConfiguracoes() {
  areaDesbloqueada = false;
  mostrarAreaAdmin();
}

function renderizarTabelaProducao() {
  const tbody = document.getElementById('corpo-tabela-producao');
  if (!tbody) return;
  tbody.innerHTML = '';

  Object.entries(producaoM2h).forEach(([malha, prod]) => {
    const tr = document.createElement('tr');
    // Formata chave numérica para exibição (ponto → vírgula)
    const malhaDisplay = String(malha).replace('.', ',');
    tr.innerHTML = `
      <td>
        <input type="text" value="${malhaDisplay}" placeholder="Ex: 2,5"
               style="width:80px"
               onchange="editarMalhaProducao(this, '${malha}', 'malha')" />
      </td>
      <td>
        <input type="text" value="${String(prod).replace('.', ',')}" placeholder="m²/h"
               oninput="editarMalhaProducao(this, '${malha}', 'producao')" />
      </td>
      <td>
        <button class="btn-remover-fator" onclick="removerMalhaProducao('${malha}')">✕</button>
      </td>`;
    tbody.appendChild(tr);
  });

  // Sincroniza select da calculadora com as malhas cadastradas
  sincronizarSelectMalha();
}

function editarMalhaProducao(input, chaveOriginal, campo) {
  if (campo === 'producao') {
    const novaProd = parseNum(input.value);
    if (!isNaN(novaProd) && novaProd > 0) {
      producaoM2h[chaveOriginal] = novaProd;
      sincronizarSelectMalha();
      document.getElementById('btn-salvar-producao').disabled = false;
    }
  }
  if (campo === 'malha') {
    const novaChave = parseNum(input.value);
    if (!isNaN(novaChave) && novaChave > 0 && String(novaChave) !== chaveOriginal) {
      const valorAtual = producaoM2h[chaveOriginal];
      // Remove chave antiga, insere nova mantendo ordem
      const novoObj = {};
      Object.entries(producaoM2h).forEach(([k, v]) => {
        novoObj[k === chaveOriginal ? novaChave : k] = v;
      });
      producaoM2h = novoObj;
      renderizarTabelaProducao();
      document.getElementById('btn-salvar-producao').disabled = false;
    }
  }
}

function removerMalhaProducao(malha) {
  if (Object.keys(producaoM2h).length <= 1) {
    alert('É necessário manter ao menos uma malha cadastrada.');
    return;
  }
  delete producaoM2h[malha];
  renderizarTabelaProducao();
  document.getElementById('btn-salvar-producao').disabled = false;
}

function adicionarMalhaProducao() {
  const chaves = Object.keys(producaoM2h).map(Number).filter(n => !isNaN(n));
  const novaChave = chaves.length > 0 ? Math.max(...chaves) + 1 : 1;
  producaoM2h[novaChave] = 1;
  renderizarTabelaProducao();
  document.getElementById('btn-salvar-producao').disabled = false;
}

/** Mantém o <select> da calculadora em sincronia com producaoM2h */
function sincronizarSelectMalha() {
  const sel = document.getElementById('prod-malha');
  if (!sel) return;
  const valorAtual = sel.value;
  sel.innerHTML = '';
  Object.keys(producaoM2h).forEach(malha => {
    const opt = document.createElement('option');
    opt.value = malha;
    opt.textContent = String(malha).replace('.', ',');
    sel.appendChild(opt);
  });
  // Tenta manter a seleção anterior
  if ([...sel.options].some(o => o.value === valorAtual)) {
    sel.value = valorAtual;
  }
}

/* ========================================
   CSV — CARREGAR / GRAVAR (banco de dados)
   ======================================== */

function parseCSVProducao(texto) {
  const dados = {};
  const linhas = texto.split('\n').filter(l => l.trim());
  linhas.forEach((linha, i) => {
    if (i === 0 && linha.toLowerCase().includes('malha')) return;
    const partes = linha.split(';');
    if (partes.length >= 2) {
      const malha = parseFloat(partes[0].trim().replace(',', '.'));
      const prod = parseFloat(partes[1].trim().replace(',', '.'));
      if (!isNaN(malha) && !isNaN(prod)) {
        dados[malha] = prod;
      }
    }
  });
  return dados;
}

function gerarCSVProducao() {
  let csv = 'Malha;Produção (m²/hora)\n';
  Object.entries(producaoM2h).forEach(([malha, prod]) => {
    csv += `${String(malha).replace('.', ',')};${String(prod).replace('.', ',')}\n`;
  });
  return csv;
}

async function carregarCSV() {
  try {
    const resp = await fetch('producao.csv?t=' + Date.now());
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const texto = await resp.text();
    const dados = parseCSVProducao(texto);
    if (Object.keys(dados).length > 0) {
      producaoM2h = dados;
    }
  } catch (e) {
    console.warn('Não foi possível carregar producao.csv:', e.message);
    const fallback = localStorage.getItem('calc-estado');
    if (fallback) {
      const estado = JSON.parse(fallback);
      if (estado.producaoM2h) {
        const obj = {};
        Object.entries(estado.producaoM2h).forEach(([k, v]) => { obj[Number(k)] = v; });
        producaoM2h = obj;
      }
    }
    if (Object.keys(producaoM2h).length === 0) {
      producaoM2h = { 2.5: 4.33, 5: 8.67, 8: 13.00, 10: 17.33 };
    }
  }
}

async function selecionarArquivoCSV() {
  if (!('showOpenFilePicker' in window)) return null;
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'Arquivo CSV',
        accept: { 'text/csv': ['.csv'] }
      }],
      excludeAcceptAllOption: true
    });
    csvFileHandle = handle;
    return handle;
  } catch (e) {
    return null;
  }
}

async function gravarCSVArquivo() {
  if (!csvFileHandle) return false;
  if (!(await csvFileHandle.queryPermission({ mode: 'readwrite' }) === 'granted')) {
    try {
      await csvFileHandle.requestPermission({ mode: 'readwrite' });
    } catch (e) {
      return false;
    }
  }
  const writable = await csvFileHandle.createWritable();
  await writable.write(gerarCSVProducao());
  await writable.close();
  return true;
}

/* ========================================
   TABELA DE PRODUTIVIDADE — SALVAR / EXPORTAR
   ======================================== */

async function salvarTabelaProducao() {
  const btn = document.getElementById('btn-salvar-producao');
  if (btn) btn.disabled = true;

  if (csvFileHandle) {
    const sucesso = await gravarCSVArquivo();
    if (sucesso) {
      mostrarFeedbackProducao('Salvo no arquivo CSV!');
    } else {
      mostrarFeedbackProducao('Salvo no navegador (erro ao gravar arquivo).');
    }
  } else if ('showOpenFilePicker' in window) {
    const handle = await selecionarArquivoCSV();
    if (handle) {
      csvFileHandle = handle;
      await gravarCSVArquivo();
      mostrarFeedbackProducao('Arquivo vinculado! Próximos salvamentos serão automáticos.');
    } else {
      mostrarFeedbackProducao('Salvo no navegador.');
    }
  } else {
    mostrarFeedbackProducao('Salvo no navegador.');
  }

  calcularProducao();
}

function mostrarFeedbackProducao(msg) {
  const el = document.getElementById('feedback-salvar-producao');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

/* ========================================
   TABELA DE PRODUTIVIDADE — EXPORTAR / IMPORTAR
   ======================================== */

function exportarProducaoJSON() {
  const dados = {
    producaoM2h,
    exportadoEm: new Date().toISOString(),
    origem: 'Calculadora Razor Industrial - Prazo de Produção'
  };
  const json = JSON.stringify(dados, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tabela-produtividade.json';
  a.click();
  URL.revokeObjectURL(url);
}

function exportarProducaoCSV() {
  let csv = 'Malha;Produção (m²/hora)\n';
  Object.entries(producaoM2h).forEach(([malha, prod]) => {
    csv += `${String(malha).replace('.', ',')};${String(prod).replace('.', ',')}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tabela-produtividade.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportarProducaoTXT() {
  let txt = 'TABELA DE PRODUTIVIDADE - RAZOR INDUSTRIAL\n';
  txt += '==========================================\n\n';
  txt += 'Malha\tProdução (m²/hora)\n';
  txt += '-----\t------------------\n';
  Object.entries(producaoM2h).forEach(([malha, prod]) => {
    txt += `${String(malha).replace('.', ',')}\t${String(prod).replace('.', ',')}\n`;
  });
  txt += '\nExportado em: ' + new Date().toLocaleString('pt-BR');
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tabela-produtividade.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function importarProducaoJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.csv,.txt';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const conteudo = ev.target.result;
        let novoDado;

        if (file.name.endsWith('.json')) {
          const dados = JSON.parse(conteudo);
          novoDado = dados.producaoM2h || dados;
        } else if (file.name.endsWith('.csv')) {
          novoDado = {};
          const linhas = conteudo.split('\n').filter(l => l.trim());
          linhas.forEach((linha, i) => {
            if (i === 0 && linha.toLowerCase().includes('malha')) return;
            const partes = linha.split(';');
            if (partes.length >= 2) {
              const malha = parseFloat(partes[0].trim().replace(',', '.'));
              const prod = parseFloat(partes[1].trim().replace(',', '.'));
              if (!isNaN(malha) && !isNaN(prod)) {
                novoDado[malha] = prod;
              }
            }
          });
        } else if (file.name.endsWith('.txt')) {
          novoDado = {};
          const linhas = conteudo.split('\n');
          linhas.forEach(linha => {
            const partes = linha.split('\t');
            if (partes.length >= 2) {
              const malha = parseFloat(partes[0].trim().replace(',', '.'));
              const prod = parseFloat(partes[1].trim().replace(',', '.'));
              if (!isNaN(malha) && !isNaN(prod)) {
                novoDado[malha] = prod;
              }
            }
          });
        }

        if (typeof novoDado !== 'object' || novoDado === null || Object.keys(novoDado).length === 0) {
          alert('Arquivo com formato inválido ou vazio.');
          return;
        }

        producaoM2h = {};
        Object.entries(novoDado).forEach(([k, v]) => {
          producaoM2h[Number(k)] = v;
        });

        renderizarTabelaProducao();
        sincronizarSelectMalha();
        calcularProducao();
        document.getElementById('btn-salvar-producao').disabled = false;
        mostrarFeedbackProducao('Dados importados! Clique em Salvar para confirmar.');
      } catch (err) {
        alert('Erro ao ler o arquivo: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ========================================
   TELA 2 — CONVERSOR DE MEDIDAS
   ======================================== */

function converterMedidas() {
  const unidade = document.getElementById('conv-unidade').value;
  const val = parseNum(document.getElementById('conv-valor').value);

  const ids = ['res-mm', 'res-cm', 'res-m', 'res-km'];
  const fatores = { km: 0.001, m: 1, cm: 100, mm: 1000 };

  if (isNaN(val)) {
    ids.forEach(id => setVal(id, '—'));
    return;
  }

  const metros = val / fatores[unidade];
  ids.forEach(id => {
    const un = id.replace('res-', '');
    const resultado = metros * fatores[un];
    setVal(id, fmtConv(resultado));
  });
}

function fmtConv(n) {
  if (isNaN(n) || n === null) return '—';
  let str = n.toFixed(4);
  str = str.replace(/0+$/, '').replace(/\.$/, '');
  str = str.replace('.', ',');
  return str || '0';
}

/* ========================================
   IMPRESSÃO / PDF
   ======================================== */

function imprimirOrcamento(tela) {
  trocarTela(tela);
  setTimeout(() => window.print(), 200);
}

/* ========================================
   PERSISTÊNCIA — LOCAL STORAGE
   OBS: Estado de desbloqueio NUNCA é salvo.
   ======================================== */

function salvarEstado() {
  try {
    const estado = {
      producaoM2h,
      producao: {
        malha:       document.getElementById('prod-malha')?.value,
        comprimento: document.getElementById('prod-comprimento')?.value,
        altura:      document.getElementById('prod-altura')?.value,
        quantidade:  document.getElementById('prod-quantidade')?.value,
        diasFila:    document.getElementById('prod-dias-fila')?.value
      },
      conversor: {
        valor:   document.getElementById('conv-valor')?.value,
        unidade: document.getElementById('conv-unidade')?.value
      }
    };
    const existente = JSON.parse(localStorage.getItem('calc-estado') || '{}');
    const merged = { ...existente, ...estado };
    localStorage.setItem('calc-estado', JSON.stringify(merged));
  } catch (e) {
    console.warn('Erro ao salvar estado:', e);
  }
}

function carregarEstado() {
  try {
    const raw = localStorage.getItem('calc-estado');
    if (!raw) return;
    const estado = JSON.parse(raw);

    if (estado.producaoM2h && typeof estado.producaoM2h === 'object') {
      const obj = {};
      Object.entries(estado.producaoM2h).forEach(([k, v]) => { obj[Number(k)] = v; });
      producaoM2h = obj;
    }

    const p = estado.producao || {};
    if (p.malha)       document.getElementById('prod-malha').value        = p.malha;
    if (p.comprimento) document.getElementById('prod-comprimento').value  = p.comprimento;
    if (p.altura)      document.getElementById('prod-altura').value       = p.altura;
    if (p.quantidade)  document.getElementById('prod-quantidade').value   = p.quantidade;
    if (p.diasFila)    document.getElementById('prod-dias-fila').value    = p.diasFila;

    const c = estado.conversor || {};
    if (c.valor)   document.getElementById('conv-valor').value   = c.valor;
    if (c.unidade) document.getElementById('conv-unidade').value = c.unidade;

  } catch (e) {
    console.warn('Erro ao restaurar estado:', e);
  }
}

/* ========================================
   INICIALIZAÇÃO
   ======================================== */

document.addEventListener('DOMContentLoaded', async () => {
  carregarTema();
  await carregarCSV();
  carregarEstado();
  sincronizarSelectMalha();
  areaDesbloqueada = false;
  mostrarAreaAdmin();
  calcularProducao();
  converterMedidas();
});
