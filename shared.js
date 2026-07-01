'use strict';

/* ========================================
   UTILITÁRIOS COMPARTILHADOS
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
