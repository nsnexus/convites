import { carregarModelos } from './compositor.js';
import { ESTILOS, FONTES, estiloPorId, personalizacaoPadrao, carregarFontes } from './estilos.js';
import { CONFIG, reais } from './config.js';

const $ = id => document.getElementById(id);
const qs = new URLSearchParams(location.search);
const dados = await carregarModelos();
const slugEditar = qs.get('editar');
const tokenEspecial = qs.get('pedido');
let especial = null, existente = null;

function erroFatal(t) { document.querySelector('main').innerHTML = `<div style="text-align:center;padding:90px 0"><h1 style="font-size:2.2rem"></h1><p style="color:var(--tinta-2);margin-top:12px">Fale com a gente pelo WhatsApp se precisar de ajuda.</p></div>`; document.querySelector('main h1').textContent = t; throw 0; }

// ---------- carregar pedido especial ou convite existente ----------
if (tokenEspecial) {
  const r = await fetch(`/api/especial/${encodeURIComponent(tokenEspecial)}`); const j = await r.json().catch(() => ({}));
  if (!r.ok) erroFatal(j.erro || 'Link inválido.');
  especial = j;
  if (j.modelo && !dados.modelos.some(m => m.id === j.modelo.id)) dados.modelos.unshift(j.modelo);
}
if (slugEditar) {
  const r = await fetch(`/api/convites/${encodeURIComponent(slugEditar)}`);
  if (!r.ok) erroFatal('Convite não encontrado.');
  existente = await r.json();
  if (existente.modelo_dados && !dados.modelos.some(m => m.id === existente.modelo_dados.id)) dados.modelos.unshift(existente.modelo_dados);
}

let modelo = dados.modelos.find(m => m.id === (existente?.modelo || especial?.modelo?.id || qs.get('modelo'))) || dados.modelos[0];
let pers = existente?.personalizacao?.estilo ? mesclar(personalizacaoPadrao(modelo.categoria), existente.personalizacao) : personalizacaoPadrao(modelo.categoria);
let ajuste = existente?.ajuste || { zoom: 1, x: .5, y: .5 };
let fotoSrc = existente?.foto_url || sessionStorage.getItem('fotoTeste') || null, arquivoFoto = null;
if (!existente && fotoSrc) arquivoFoto = await (await fetch(fotoSrc)).blob();

// ---------- prévia (iframe) ----------
const iframe = $('previa');
let previaPronta = false, agendado;
window.addEventListener('message', e => { if (e.origin === location.origin && e.data?.tipo === 'previa-pronta') { previaPronta = true; atualizar(); } });
iframe.addEventListener('load', () => { if (iframe.contentWindow.atualizarPrevia) { previaPronta = true; atualizar(); } });
function atualizar() {
  clearTimeout(agendado);
  agendado = setTimeout(() => { if (previaPronta) iframe.contentWindow.atualizarPrevia?.(dadosPrevia()); }, 120);
}
function dadosPrevia() {
  const v = id => $(id).value.trim();
  return {
    slug: 'previa', homenageado: v('homenageado') || 'Nome', idade: v('idade'), titulo: v('tituloConvite'),
    data: v('data') || proximoSabado(), hora: v('hora') || '19:00', local: v('local') || 'Local da festa', endereco: v('endereco') || 'Endereço da festa',
    recado: v('recado'), personalizacao: pers, modelo_dados: modelo, foto_url: fotoSrc, ajuste,
  };
}
function proximoSabado() { const d = new Date(Date.now() + 30 * 864e5); d.setDate(d.getDate() + (6 - d.getDay())); return d.toISOString().slice(0, 10); }
document.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => iframe.contentWindow.irPara?.(b.dataset.ir));
$('verFone').onclick = () => { $('lado').classList.add('aberto'); atualizar(); };
$('fecharFone').onclick = () => $('lado').classList.remove('aberto');

// ---------- 1. abertura e foto ----------
dados.categorias.forEach(c => {
  const g = document.createElement('optgroup'); g.label = c.nome;
  dados.modelos.filter(m => m.categoria === c.id).forEach(m => g.append(new Option(m.nome, m.id, false, m.id === modelo.id)));
  $('modelo').append(g);
});
if (!$('modelo').value || ![...$('modelo').options].some(o => o.value === modelo.id)) $('modelo').append(new Option(modelo.nome, modelo.id, true, true));
if (especial?.modelo || existente) $('modelo').disabled = true;
$('modeloCapa').src = modelo.poster;
$('modelo').onchange = e => {
  const novo = dados.modelos.find(m => m.id === e.target.value);
  // se o cliente ainda não mexeu no estilo, acompanha a categoria do vídeo
  if (pers.estilo === personalizacaoPadrao(modelo.categoria).estilo) { pers.estilo = personalizacaoPadrao(novo.categoria).estilo; pers.cores = { destaque: '', fundo: '' }; pintarEstilos(); }
  modelo = novo; $('modeloCapa').src = modelo.poster; atualizar(); iframe.contentWindow.irPara?.('video');
};
if (existente) { $('btFoto').hidden = true; $('fotoInfo').textContent = 'A foto não pode ser trocada depois do pedido, mas você pode ajustar o enquadramento.'; $('ajustes').hidden = false; }
else if (fotoSrc) { $('ajustes').hidden = false; $('fotoInfo').textContent = 'Usando a foto que você testou na página inicial.'; }
$('zoom').value = ajuste.zoom; $('px').value = ajuste.x; $('py').value = ajuste.y;
$('foto').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  if (!f.type.startsWith('image/')) return mostrarErro('Escolha um arquivo de imagem (JPG ou PNG).');
  const im = new Image(); im.src = URL.createObjectURL(f); await im.decode();
  const s = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  arquivoFoto = await new Promise(ok => c.toBlob(ok, 'image/jpeg', .88));
  fotoSrc = URL.createObjectURL(arquivoFoto);
  $('ajustes').hidden = false; $('fotoInfo').textContent = 'Ajuste o enquadramento se precisar.';
  atualizar(); setTimeout(() => iframe.contentWindow.irPara?.('foto'), 300);
};
['zoom', 'px', 'py'].forEach(id => $(id).oninput = () => { ajuste = { zoom: +$('zoom').value, x: +$('px').value, y: +$('py').value }; atualizar(); });
['zoom', 'px', 'py'].forEach(id => $(id).onchange = () => iframe.contentWindow.irPara?.('foto'));

// ---------- 2. festa ----------
['homenageado', 'idade', 'tituloConvite', 'data', 'hora', 'local', 'endereco', 'recado'].forEach(id => $(id).addEventListener('input', atualizar));
if (existente) {
  const set = (id, v) => $(id).value = v || '';
  set('homenageado', existente.homenageado); set('idade', existente.idade); set('tituloConvite', existente.titulo); set('data', existente.data);
  set('hora', existente.hora); set('local', existente.local); set('endereco', existente.endereco); set('recado', existente.recado);
}

// ---------- 3. estilo ----------
carregarFontes(Object.values(FONTES).map(f => f.google));
function pintarEstilos() {
  const box = $('estilos'); box.textContent = '';
  ESTILOS.forEach(e => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'estilo'; b.setAttribute('aria-pressed', e.id === pers.estilo);
    b.innerHTML = `<span class="amostra" aria-hidden="true">Aa<i></i></span><span class="nome"></span>`;
    const a = b.querySelector('.amostra'); a.style.background = e.cores.fundo; a.style.color = e.cores.texto; a.style.fontFamily = FONTES[e.titulo].css;
    a.querySelector('i').style.background = e.cores.destaque;
    b.querySelector('.nome').textContent = e.nome;
    b.onclick = () => { pers.estilo = e.id; pers.cores = { destaque: '', fundo: '' }; pers.fonte = ''; pintarEstilos(); atualizar(); iframe.contentWindow.irPara?.('convite'); };
    box.append(b);
  });
  const e = estiloPorId(pers.estilo);
  $('corDestaque').value = pers.cores.destaque || e.cores.destaque;
  $('corFundo').value = pers.cores.fundo || e.cores.fundo;
  $('fonte').value = pers.fonte;
}
$('fonte').append(new Option('Padrão do estilo', ''), ...Object.entries(FONTES).map(([k, f]) => new Option(f.nome, k)));
$('corDestaque').oninput = e => { pers.cores.destaque = e.target.value; atualizar(); };
$('corFundo').oninput = e => { pers.cores.fundo = e.target.value; atualizar(); };
$('fonte').onchange = e => { pers.fonte = e.target.value; atualizar(); };
document.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => { pers.cores[b.dataset.reset] = ''; pintarEstilos(); atualizar(); });
pintarEstilos();

// ---------- 4. blocos ----------
const caminho = (obj, p) => p.split('.').reduce((o, k) => o[k], obj);
const definir = (obj, p, v) => { const ks = p.split('.'); const ult = ks.pop(); ks.reduce((o, k) => o[k], obj)[ult] = v; };
document.querySelectorAll('.liga').forEach(cb => {
  cb.checked = !!caminho(pers.blocos, cb.dataset.bloco);
  cb.onchange = () => { definir(pers.blocos, cb.dataset.bloco, cb.checked); atualizar(); if (cb.checked) iframe.contentWindow.irPara?.('convite'); };
});
function pintarProg() {
  const box = $('progItens'); box.textContent = '';
  if (!pers.blocos.programacao.itens.length) pers.blocos.programacao.itens.push({ hora: '', texto: '' });
  pers.blocos.programacao.itens.forEach((it, i) => {
    const linha = document.createElement('div'); linha.className = 'prog-item';
    const h = Object.assign(document.createElement('input'), { type: 'time', value: it.hora, ariaLabel: 'Horário' });
    const t = Object.assign(document.createElement('input'), { value: it.texto, placeholder: 'Ex.: Parabéns', maxLength: 80, ariaLabel: 'O que acontece' });
    const x = Object.assign(document.createElement('button'), { type: 'button', className: 'x', textContent: '×', ariaLabel: 'Remover horário' });
    h.oninput = () => { it.hora = h.value; atualizar(); }; t.oninput = () => { it.texto = t.value; atualizar(); };
    x.onclick = () => { pers.blocos.programacao.itens.splice(i, 1); pintarProg(); atualizar(); };
    linha.append(h, t, x); box.append(linha);
  });
}
$('addProg').onclick = () => { if (pers.blocos.programacao.itens.length < 12) { pers.blocos.programacao.itens.push({ hora: '', texto: '' }); pintarProg(); } };
pintarProg();
function pintarTraje() {
  const box = $('trajeCores'); box.textContent = '';
  pers.blocos.traje.cores.forEach((c, i) => {
    const inp = Object.assign(document.createElement('input'), { type: 'color', value: c, title: 'Clique para mudar. Clique com o botão direito para remover.', ariaLabel: `Cor sugerida ${i + 1}` });
    inp.oninput = () => { pers.blocos.traje.cores[i] = inp.value; atualizar(); };
    const x = Object.assign(document.createElement('button'), { type: 'button', className: 'mini-bt', textContent: 'remover', ariaLabel: `Remover cor ${i + 1}` });
    x.onclick = () => { pers.blocos.traje.cores.splice(i, 1); pintarTraje(); atualizar(); };
    const w = document.createElement('span'); w.style.cssText = 'display:grid;justify-items:center'; w.append(inp, x); box.append(w);
  });
  if (pers.blocos.traje.cores.length < 5) {
    const add = Object.assign(document.createElement('button'), { type: 'button', className: 'mini-bt', textContent: '+ Cor sugerida' });
    add.onclick = () => { pers.blocos.traje.cores.push(estiloPorId(pers.estilo).cores.destaque); pintarTraje(); atualizar(); };
    box.append(add);
  }
}
pintarTraje();
const ligar = (id, get, set) => { $(id).value = get() ?? ''; $(id).addEventListener('input', () => { set($(id).value); atualizar(); }); };
ligar('trajeTexto', () => pers.blocos.traje.texto, v => pers.blocos.traje.texto = v);
ligar('presItens', () => pers.blocos.presentes.itens.join('\n'), v => pers.blocos.presentes.itens = v.split('\n').map(s => s.trim()).filter(Boolean));
ligar('presPix', () => pers.blocos.presentes.pix, v => pers.blocos.presentes.pix = v);
ligar('presTam', () => pers.blocos.presentes.tamanhos, v => pers.blocos.presentes.tamanhos = v);
ligar('rsvpLimite', () => pers.blocos.rsvp.limite, v => pers.blocos.rsvp.limite = Math.min(30, Math.max(1, parseInt(v, 10) || 1)));
ligar('rsvpPrazo', () => pers.blocos.rsvp.prazo, v => pers.blocos.rsvp.prazo = v);
ligar('obsTexto', () => pers.blocos.observacoes.texto, v => pers.blocos.observacoes.texto = v);
$('rsvpCriancas').checked = pers.blocos.rsvp.criancas;
$('rsvpCriancas').onchange = e => { pers.blocos.rsvp.criancas = e.target.checked; atualizar(); };

// ---------- 5/6. música, dados e total ----------
if (especial) {
  $('especialInfo').hidden = false; $('especialDesc').textContent = especial.descricao; $('etapaMusica').hidden = true;
  if (especial.cliente_nome) $('cliente').value = especial.cliente_nome;
  if (especial.cliente_whatsapp) $('whatsapp').value = especial.cliente_whatsapp;
  if (especial.cliente_email) $('email').value = especial.cliente_email;
}
if (existente) {
  $('titulo').textContent = 'Editar convite'; $('subtitulo').textContent = 'As mudanças valem no mesmo link, assim que você salvar.';
  $('etapaMusica').hidden = true; $('etapaDados').hidden = true;
  $('totalRotulo').textContent = 'Convite'; $('total').textContent = existente.previa ? 'Prévia' : 'No ar';
  $('enviar').textContent = 'Salvar alterações';
}
const total = () => especial ? especial.valor_centavos : CONFIG.precoConvite + (document.querySelector('[name=musica]:checked').value === 'personalizada' ? CONFIG.precoMusica : 0);
if (!existente) { document.querySelectorAll('[name=musica]').forEach(r => r.onchange = () => $('total').textContent = reais(total())); $('total').textContent = reais(total()); }

function mostrarErro(t) { $('erro').textContent = t; $('erro').hidden = false; $('erro').scrollIntoView({ block: 'center', behavior: 'smooth' }); }

// ---------- enviar ----------
$('form').onsubmit = async e => {
  e.preventDefault(); $('erro').hidden = true;
  const visiveis = [...$('form').querySelectorAll('[required]')].filter(i => !i.closest('[hidden]'));
  const falta = visiveis.find(i => !i.value.trim());
  if (falta) { falta.focus(); return mostrarErro(`Preencha o campo "${$('form').querySelector(`label[for=${falta.id}]`).textContent}".`); }
  const bt = $('enviar'); bt.disabled = true;

  if (existente) {
    const corpo = { slug: existente.slug, homenageado: $('homenageado').value, idade: $('idade').value, titulo: $('tituloConvite').value, data: $('data').value, hora: $('hora').value,
      local: $('local').value, endereco: $('endereco').value, recado: $('recado').value, personalizacao: pers, ajuste };
    const token = JSON.parse(localStorage.getItem('nsPedidos') || '{}')[existente.slug]?.token;
    try {
      let r = token ? await fetch(`/api/convites/${existente.slug}`, { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-token': token }, body: JSON.stringify(corpo) }) : null;
      if (!r || r.status === 403) r = await fetch('/api/conta/convites', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
      if (r.status === 401) throw new Error('Para editar, entre em Meus convites com o e-mail do pedido.');
      const j = await r.json(); if (!r.ok) throw new Error(j.erro);
      location.href = `/c/${existente.slug}`;
    } catch (err) { mostrarErro(err.message || 'Não foi possível salvar.'); bt.disabled = false; }
    return;
  }

  if (!arquivoFoto) { bt.disabled = false; return mostrarErro('Escolha a foto que vai aparecer na moldura.'); }
  if ($('whatsapp').value.replace(/\D/g, '').length < 10) { bt.disabled = false; $('whatsapp').focus(); return mostrarErro('Confira o número de WhatsApp com DDD.'); }
  if (!$('email').checkValidity()) { bt.disabled = false; $('email').focus(); return mostrarErro('Confira o e-mail. É nele que o link do convite chega.'); }
  const fd = new FormData();
  ['homenageado', 'idade', 'data', 'hora', 'local', 'endereco', 'recado', 'cliente', 'whatsapp', 'email'].forEach(id => fd.set(id, $(id).value));
  fd.set('titulo', $('tituloConvite').value);
  fd.set('musica', document.querySelector('[name=musica]:checked').value);
  fd.set('modelo', modelo.id); fd.set('ajuste', JSON.stringify(ajuste)); fd.set('personalizacao', JSON.stringify(pers));
  fd.set('foto', arquivoFoto, 'foto.jpg');
  if (tokenEspecial) fd.set('pedido', tokenEspecial);
  bt.textContent = 'Salvando…';
  try {
    const r = await fetch('/api/convites', { method: 'POST', body: fd }); const j = await r.json();
    if (!r.ok) throw new Error(j.erro || 'Não foi possível salvar o pedido.');
    const meus = JSON.parse(localStorage.getItem('nsPedidos') || '{}'); meus[j.slug] = { id: j.id, token: j.token }; localStorage.setItem('nsPedidos', JSON.stringify(meus));
    sessionStorage.removeItem('fotoTeste');
    location.href = `/c/${j.slug}`;
  } catch (err) { mostrarErro(err.message + ' Tente de novo em instantes.'); bt.disabled = false; bt.textContent = 'Ver convite pronto'; }
};

function mesclar(base, p) {
  const out = { ...base, ...p, cores: { ...base.cores, ...(p.cores || {}) }, blocos: { ...base.blocos } };
  for (const [k, v] of Object.entries(p.blocos || {})) out.blocos[k] = typeof v === 'object' && v && !Array.isArray(v) ? { ...base.blocos[k], ...v } : v;
  return out;
}
atualizar();
