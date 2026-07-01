'use strict';

/* ========================================
   TELA 3 — MATERIAIS PARA MURETA
   ======================================== */

function calcularMureta() {
  const metros      = parseNum(document.getElementById('mur-metros').value);
  const fiadasBloco = parseNum(document.getElementById('mur-fiada-bloco').value);
  const fiadasCan   = parseNum(document.getElementById('mur-fiada-canaleta').value);

  if (isNaN(metros) || metros <= 0) {
    setErro('erro-mureta', 'Informe os metros lineares.');
    limparResultadosMureta(); return;
  }
  if (isNaN(fiadasBloco) || fiadasBloco < 0) {
    setErro('erro-mureta', 'Informe a fiada do bloco.');
    limparResultadosMureta(); return;
  }
  if (isNaN(fiadasCan) || fiadasCan < 0) {
    setErro('erro-mureta', 'Informe a fiada da canaleta.');
    limparResultadosMureta(); return;
  }
  setErro('erro-mureta', '');

  const blocos       = metros * 2.5 * fiadasBloco;
  const meioBloco    = Math.ceil(blocos * 0.15);
  const canaleta     = metros * 2.5 * fiadasCan;
  const meiaCanaleta = Math.ceil(canaleta * 0.15);
  const cimento      = Math.ceil(metros * 0.13);
  const areia        = metros * 0.03;
  const pedrisco     = metros * 0.015;

  setVal('res-bloco',         fmtInt(blocos));
  setVal('res-meio-bloco',    fmtInt(meioBloco));
  setVal('res-canaleta',      fmtInt(canaleta));
  setVal('res-meia-canaleta', fmtInt(meiaCanaleta));
  setVal('res-cimento',       fmtInt(cimento));
  setVal('res-areia',         fmt(areia, 1));
  setVal('res-pedrisco',      fmt(pedrisco, 2));

  salvarEstado();
}

function limparResultadosMureta() {
  ['res-bloco','res-meio-bloco','res-canaleta','res-meia-canaleta',
   'res-cimento','res-areia','res-pedrisco'].forEach(id => setVal(id, '—'));
}

function limparMureta() {
  ['mur-metros','mur-altura'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('mur-fiada-bloco').value = '1';
  document.getElementById('mur-fiada-canaleta').value = '1';
  limparResultadosMureta();
  setErro('erro-mureta', '');
  salvarEstado();
}

/* ========================================
   PERSISTÊNCIA — LOCAL STORAGE
   ======================================== */

function salvarEstado() {
  try {
    const estado = {
      mureta: {
        metros:        document.getElementById('mur-metros')?.value,
        fiadaBloco:    document.getElementById('mur-fiada-bloco')?.value,
        fiadaCanaleta: document.getElementById('mur-fiada-canaleta')?.value,
        altura:        document.getElementById('mur-altura')?.value
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
    const m = estado.mureta || {};
    if (m.metros)        document.getElementById('mur-metros').value         = m.metros;
    if (m.fiadaBloco)    document.getElementById('mur-fiada-bloco').value    = m.fiadaBloco;
    if (m.fiadaCanaleta) document.getElementById('mur-fiada-canaleta').value = m.fiadaCanaleta;
    if (m.altura)        document.getElementById('mur-altura').value         = m.altura;
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
  calcularMureta();
});
