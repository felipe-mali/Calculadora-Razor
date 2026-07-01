'use strict';

/* ========================================
   TELA 4 — PESO DA MALHA / BOBINA
   ======================================== */

const SENHA_ADMIN = "M@lima1980";

const VERSAO_TABELA = 2;

const TABELA_PESO_PADRAO = {
  malha2_5: { bwg12: 4.00, bwg14: 2.38, bwg16: 1.40 },
  malha5:   { bwg12: 2.85, bwg14: 1.15, bwg16: 0.80 },
  malha8:   { bwg12: 1.35, bwg14: 0.90 },
  malha10:  { bwg12: 1.00, bwg14: 0.65 }
};

let tabelaPeso = JSON.parse(JSON.stringify(TABELA_PESO_PADRAO));

const MALHAS_LABELS = {
  malha2_5: 'Malha 2,5', malha5: 'Malha 5',
  malha8:   'Malha 8',   malha10: 'Malha 10'
};
const BWG_LABELS = {
  bwg10: 'BWG 10', bwg12: 'BWG 12', bwg14: 'BWG 14', bwg16: 'BWG 16'
};

/* ========================================
   DROPDOWN BWG DINÂMICO
   ======================================== */

function atualizarBwgOptions() {
  const malha = document.getElementById('malha-tipo').value;
  const sel = document.getElementById('malha-bwg');
  if (!sel) return;
  const valorAtual = sel.value;
  sel.innerHTML = '<option value="">— Selecione —</option>';

  if (malha && tabelaPeso[malha]) {
    Object.keys(tabelaPeso[malha]).forEach(bwg => {
      const opt = document.createElement('option');
      opt.value = bwg;
      opt.textContent = BWG_LABELS[bwg] ?? bwg;
      sel.appendChild(opt);
    });
  }

  if ([...sel.options].some(o => o.value === valorAtual)) {
    sel.value = valorAtual;
  }
}

/* ========================================
   TELA 4 — CÁLCULO
   ======================================== */

function calcularMalha() {
  const malha   = document.getElementById('malha-tipo').value;
  const bwg     = document.getElementById('malha-bwg').value;
  const metros  = parseNum(document.getElementById('malha-metros').value);
  const altura  = parseNum(document.getElementById('malha-altura').value);
  const bobinas = parseNum(document.getElementById('malha-bobinas').value);

  atualizarBwgOptions();

  if (!malha || !bwg) {
    setErro('erro-malha', '');
    setVal('res-peso-bobina', '—');
    setVal('res-peso-total', '—');
    return;
  }
  if (isNaN(metros) || metros <= 0) {
    setErro('erro-malha', 'Informe os metros lineares.');
    setVal('res-peso-bobina', '—');
    setVal('res-peso-total', '—');
    return;
  }

  const pesoPorMetro = tabelaPeso[malha]?.[bwg] ?? null;
  if (pesoPorMetro === null) {
    setErro('erro-malha', 'Peso não definido para esta combinação. Desbloqueie a tabela de pesos para ajustar.');
    setVal('res-peso-bobina', '—');
    setVal('res-peso-total', '—');
    return;
  }

  setErro('erro-malha', '');

  const alt        = (!isNaN(altura)  && altura  > 0) ? altura  : 1;
  const qtdBobinas = (!isNaN(bobinas) && bobinas > 0) ? bobinas : 1;

  const pesoBobina = pesoPorMetro * metros * alt;
  const pesoTotal  = pesoBobina * qtdBobinas;

  setVal('res-peso-bobina', fmt(pesoBobina, 2));
  setVal('res-peso-total',  fmt(pesoTotal, 2));

  salvarEstado();
}

function limparMalha() {
  ['malha-metros','malha-altura','malha-bobinas'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('malha-tipo').value = '';
  document.getElementById('malha-bwg').value  = '';
  setVal('res-peso-bobina', '—');
  setVal('res-peso-total',  '—');
  setErro('erro-malha', '');
  atualizarBwgOptions();
  salvarEstado();
}

/* ========================================
   TABELA DE PESOS — PROTEÇÃO POR SENHA
   ======================================== */

let areaPesosDesbloqueada = false;

function desbloquearPesos() {
  const senha = prompt('Digite a senha para desbloquear a tabela de pesos:');
  if (senha === null) return;
  if (senha === SENHA_ADMIN) {
    areaPesosDesbloqueada = true;
    mostrarAreaPesos();
  } else {
    alert('Senha incorreta. Acesso negado.');
  }
}

function bloquearPesos() {
  areaPesosDesbloqueada = false;
  mostrarAreaPesos();
}

function mostrarAreaPesos() {
  const area       = document.getElementById('area-admin-pesos');
  const btnDesbloq = document.getElementById('btn-desbloquear-pesos');
  const btnBloquear = document.getElementById('btn-bloquear-pesos');
  const badge      = document.getElementById('badge-pesos');

  if (areaPesosDesbloqueada) {
    area.classList.remove('hidden');
    btnDesbloq.classList.add('hidden');
    btnBloquear.classList.remove('hidden');
    if (badge) badge.textContent = 'Desbloqueado';
    renderizarTabelaPesos();
  } else {
    area.classList.add('hidden');
    btnDesbloq.classList.remove('hidden');
    btnBloquear.classList.add('hidden');
    if (badge) badge.textContent = 'Bloqueado';
  }
}

/* ========================================
   TABELA DE PESOS — RENDERIZAÇÃO
   ======================================== */

function renderizarTabelaPesos() {
  const tbody = document.getElementById('corpo-tabela-pesos');
  if (!tbody) return;
  tbody.innerHTML = '';

  Object.entries(tabelaPeso).forEach(([malha, bwgs]) => {
    Object.entries(bwgs).forEach(([bwg, peso]) => {
      const tr = document.createElement('tr');
      const pesoStr = peso !== null ? String(peso).replace('.', ',') : '';
      tr.innerHTML = `
        <td>${MALHAS_LABELS[malha] ?? malha}</td>
        <td>${BWG_LABELS[bwg] ?? bwg}</td>
        <td>
          <input type="text" value="${pesoStr}" placeholder="Ex: 1,25"
                 oninput="editarPesoTemp(this, '${malha}', '${bwg}')" />
        </td>
        <td>
          <button class="btn-remover-fator" onclick="removerPeso('${malha}', '${bwg}')">✕</button>
        </td>`;
      tbody.appendChild(tr);
    });
  });
}

function editarPesoTemp(input, malha, bwg) {
  const val = parseNum(input.value);
  tabelaPeso[malha][bwg] = isNaN(val) ? null : val;
  document.getElementById('btn-salvar-pesos').disabled = false;
}

function removerPeso(malha, bwg) {
  delete tabelaPeso[malha][bwg];
  if (Object.keys(tabelaPeso[malha]).length === 0) {
    delete tabelaPeso[malha];
  }
  renderizarTabelaPesos();
  document.getElementById('btn-salvar-pesos').disabled = false;
}

/* ========================================
   TABELA DE PESOS — SALVAR
   ======================================== */

function salvarTabelaPesos() {
  salvarEstado();
  calcularMalha();
  const btn = document.getElementById('btn-salvar-pesos');
  if (btn) btn.disabled = true;
  mostrarFeedback('Salvo com sucesso!');
}

function mostrarFeedback(msg) {
  const el = document.getElementById('feedback-salvar');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

/* ========================================
   TABELA DE PESOS — EXPORTAR / IMPORTAR
   ======================================== */

function exportarPesosJSON() {
  const dados = {
    tabelaPeso,
    exportadoEm: new Date().toISOString(),
    origem: 'Calculadora Razor Industrial'
  };
  const json = JSON.stringify(dados, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tabela-pesos-malha.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importarPesosJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const dados = JSON.parse(ev.target.result);
        const novoPeso = dados.tabelaPeso || dados;
        if (typeof novoPeso !== 'object' || novoPeso === null) {
          alert('Arquivo JSON com formato inválido.');
          return;
        }
        tabelaPeso = novoPeso;
        renderizarTabelaPesos();
        atualizarBwgOptions();
        calcularMalha();
        document.getElementById('btn-salvar-pesos').disabled = false;
        mostrarFeedback('Dados importados! Clique em Salvar para confirmar.');
      } catch (err) {
        alert('Erro ao ler o arquivo: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ========================================
   PERSISTÊNCIA — LOCAL STORAGE
   ======================================== */

function salvarEstado() {
  try {
    const estado = {
      versaoTabela: VERSAO_TABELA,
      tabelaPeso,
      malha: {
        tipo:    document.getElementById('malha-tipo')?.value,
        bwg:     document.getElementById('malha-bwg')?.value,
        metros:  document.getElementById('malha-metros')?.value,
        altura:  document.getElementById('malha-altura')?.value,
        bobinas: document.getElementById('malha-bobinas')?.value
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
    const versaoSalva = estado.versaoTabela || 1;
    if (versaoSalva < VERSAO_TABELA) {
      localStorage.removeItem('calc-estado');
      return;
    }
    if (estado.tabelaPeso) tabelaPeso = estado.tabelaPeso;
    const b = estado.malha || {};
    if (b.tipo)    document.getElementById('malha-tipo').value    = b.tipo;
    if (b.bwg)     document.getElementById('malha-bwg').value     = b.bwg;
    if (b.metros)  document.getElementById('malha-metros').value  = b.metros;
    if (b.altura)  document.getElementById('malha-altura').value  = b.altura;
    if (b.bobinas) document.getElementById('malha-bobinas').value = b.bobinas;
  } catch (e) {
    console.warn('Erro ao restaurar estado:', e);
  }
}

/* ========================================
   INICIALIZAÇÃO
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  carregarTema();
  carregarEstado();
  atualizarBwgOptions();
  areaPesosDesbloqueada = false;
  mostrarAreaPesos();
  calcularMalha();
});
