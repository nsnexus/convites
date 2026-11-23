import { CONFIG, reais, ligarSuporte } from './config.js';
ligarSuporte();
const $ = id => document.getElementById(id);
const telas = ['telaEmail', 'telaLista', 'telaConvite'];
const mostrar = t => { telas.forEach(x => $(x).hidden = x !== t); $('sair').hidden = !['telaLista', 'telaConvite'].includes(t); scrollTo(0, 0); };
const dataBR = d => new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
const NOME_ST = { aguardando_pagamento: 'Aguardando pagamento', pago: 'No ar', publicado: 'No ar', cancelado: 'Cancelado' };

async function api(caminho, opcoes = {}) {
  const r = await fetch(`/api/conta/${caminho}`, { method: opcoes.metodo || 'GET', headers: opcoes.corpo ? { 'content-type': 'application/json' } : {}, body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !['codigo', 'entrar'].includes(caminho)) { mostrar('telaEmail'); throw new Error(j.erro); }
  if (!r.ok) throw new Error(j.erro || 'Algo deu errado. Tente de novo.');
  return j;
}
const erro = (id, t) => { $(id).textContent = t; $(id).hidden = !t; };

$('formEmail').onsubmit = async e => {
  e.preventDefault(); erro('erroEmail', '');
  const contato = $('contato').value.trim();
  const bt = e.submitter || $('formEmail').querySelector('button');
  bt.disabled = true; bt.textContent = 'Buscando…';
  try {
    await api('entrar', { metodo: 'POST', corpo: { contato } });
    await carregarLista();
  } catch (err) { mostrar('telaEmail'); erro('erroEmail', err.message); }
  finally { bt.disabled = false; bt.textContent = 'Buscar meus convites'; }
};
$('sair').onclick = async () => { await api('entrar', { metodo: 'DELETE' }).catch(() => {}); mostrar('telaEmail'); };

async function carregarLista() {
  const j = await api('convites');
  $('quem').textContent = j.cliente?.contato || j.cliente?.email || '';
  const l = $('lista'); l.textContent = '';
  if (!j.convites.length) l.innerHTML = '<p style="color:var(--tinta-2)">Você ainda não tem convites. <a href="/#modelos">Escolha um modelo</a> para começar.</p>';
  j.convites.forEach(c => {
    const b = document.createElement('button'); b.className = 'conv';
    b.innerHTML = `<img alt=""><div><h2></h2><div class="meta"></div><div class="num"></div></div>`;
    b.querySelector('img').src = c.poster || '';
    b.querySelector('h2').textContent = c.titulo || c.homenageado;
    const st = document.createElement('span'); st.className = `st st-${c.status}`; st.textContent = NOME_ST[c.status]; b.querySelector('h2').append(st);
    b.querySelector('.meta').textContent = `${dataBR(c.data)} às ${c.hora.replace(':', 'h')} · ${c.local}`;
    b.querySelector('.num').textContent = c.status === 'aguardando_pagamento' ? 'Prévia: falta liberar' : `${c.confirmados} ${c.confirmados == 1 ? 'pessoa confirmada' : 'pessoas confirmadas'}`;
    b.onclick = () => abrir(c.slug);
    l.append(b);
  });
  mostrar('telaLista');
}

let atual, lista = [];
async function abrir(slug) {
  const j = await api(`convites?slug=${slug}`); atual = j.convite; lista = j.confirmacoes;
  const c = j.convite, l = j.confirmacoes, link = `${location.origin}/c/${c.slug}`;
  $('cTitulo').textContent = c.titulo || c.homenageado;
  const vao = l.filter(x => x.vai);
  $('nAdultos').textContent = vao.reduce((s, x) => s + (x.adultos || x.pessoas || 0), 0);
  $('nCriancas').textContent = vao.reduce((s, x) => s + (x.criancas || 0), 0);
  $('nResp').textContent = l.length; $('nNao').textContent = l.length - vao.length;
  const pronto = c.status === 'pago' || c.status === 'publicado';
  $('faixaLib').hidden = pronto;
  $('cLiberar').href = CONFIG.checkoutUrl ? CONFIG.checkoutUrl + encodeURIComponent(c.pedido_id) : `/obrigado?pedido=${c.pedido_id}`;
  $('cLiberar').textContent = `Liberar convite · ${reais(c.valor_centavos)}`;
  $('cAbrir').href = link; $('cAbrir').textContent = pronto ? 'Abrir convite' : 'Ver prévia';
  $('cCopiar').hidden = !pronto; $('cZap').hidden = !pronto; $('cPlanilha').hidden = !l.length;
  $('cEditar').href = `/criar?editar=${c.slug}`;
  $('cZap').href = `https://wa.me/?text=${encodeURIComponent(`Você está convidado! ${link}`)}`;
  $('cCopiar').onclick = () => navigator.clipboard.writeText(link).then(() => { $('cCopiar').textContent = 'Link copiado'; setTimeout(() => $('cCopiar').textContent = 'Copiar link', 2000); });
  const r = $('respostas'); r.textContent = '';
  if (!pronto) r.innerHTML = '<p style="color:var(--tinta-2)">As confirmações aparecem aqui depois que o convite for liberado.</p>';
  else if (!l.length) r.innerHTML = '<p style="color:var(--tinta-2)">Ninguém respondeu ainda. Mande o link para os convidados.</p>';
  l.forEach(x => {
    const d = document.createElement('div'); d.className = 'resp';
    d.innerHTML = '<span class="s"></span><strong></strong><p></p>';
    d.querySelector('.s').className = `s ${x.vai ? 'sim' : 'nao'}`;
    const ad = x.adultos || (x.vai ? x.pessoas : 0), cr = x.criancas || 0;
    d.querySelector('.s').textContent = x.vai ? `Vai · ${ad} ${ad > 1 ? 'adultos' : 'adulto'}${cr ? ` e ${cr} ${cr > 1 ? 'crianças' : 'criança'}` : ''}` : 'Não vai';
    d.querySelector('strong').textContent = x.nome;
    d.querySelector('p').textContent = [x.presente && `Presente: ${x.presente}`, x.restricoes && `Restrição: ${x.restricoes}`, x.recado].filter(Boolean).join(' — ');
    r.append(d);
  });
  mostrar('telaConvite');
}
$('voltar').onclick = carregarLista;
$('cPlanilha').onclick = () => {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = [['Nome', 'Vai', 'Adultos', 'Crianças', 'Presente', 'Restrição alimentar', 'Recado', 'Respondeu em'].map(esc).join(';')];
  lista.forEach(x => linhas.push([x.nome, x.vai ? 'Sim' : 'Não', x.vai ? (x.adultos || x.pessoas) : 0, x.criancas || 0, x.presente || '', x.restricoes || '', x.recado || '', new Date(x.criado_em).toLocaleString('pt-BR')].map(esc).join(';')));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  a.download = `convidados-${atual.slug}.csv`; a.click();
};

// já logado? vai direto para a lista
carregarLista().catch(() => mostrar('telaEmail'));
