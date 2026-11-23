import { Compositor, fotoExemplo } from './compositor.js';
import { Rastreador } from './rastreador.js';
import { reais } from './config.js';

const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...filhos) => { const e = Object.assign(document.createElement(tag), props); e.append(...filhos.filter(f => f != null)); return e; };
const esc = s => String(s ?? '');
const dataBR = d => d ? new Date(d.length === 10 ? d + 'T12:00' : d).toLocaleDateString('pt-BR') : '';
const zapLink = (num, txt) => `https://wa.me/${String(num).replace(/\D/g, '').replace(/^(?!55)/, '55')}?text=${encodeURIComponent(txt)}`;

function avisar(t) { const a = $('aviso'); a.textContent = t; a.hidden = false; clearTimeout(avisar.t); avisar.t = setTimeout(() => a.hidden = true, 3200); }

async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const r = await fetch(`/api/admin/${caminho}`, { method: metodo, headers: corpo ? { 'content-type': 'application/json' } : {}, body: corpo ? JSON.stringify(corpo) : undefined });
  if (r.status === 401 && caminho !== 'login') { mostrarLogin(); throw new Error('Faça login.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erro || `Erro ${r.status}`);
  return j;
}

// ---------- login ----------
function mostrarLogin() { $('telaAdmin').hidden = true; $('telaLogin').hidden = false; $('senha').focus(); }
$('formLogin').onsubmit = async e => {
  e.preventDefault(); $('erroLogin').hidden = true;
  try { await api('login', { metodo: 'POST', corpo: { senha: $('senha').value } }); iniciar(); }
  catch (err) { $('erroLogin').textContent = err.message; $('erroLogin').hidden = false; }
};
$('sair').onclick = async () => { await api('login', { metodo: 'DELETE' }).catch(() => {}); mostrarLogin(); };

// ---------- abas ----------
document.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => abrirAba(b.dataset.aba));
function abrirAba(nome) {
  document.querySelectorAll('[data-aba]').forEach(b => b.setAttribute('aria-selected', b.dataset.aba === nome));
  document.querySelectorAll('[data-painel]').forEach(p => p.hidden = p.dataset.painel !== nome);
  ({ pedidos: carregarPedidos, especiais: carregarEspeciais, modelos: carregarModelos, categorias: carregarCats, config: carregarConfigAdm })[nome]();
  history.replaceState(null, '', `#${nome}`);
}

let categorias = [], modelos = [];
async function iniciar() {
  // garante as tabelas do banco (na primeira vez cria tudo; depois só aplica o que for novo)
  try { const r = await api('instalar', { metodo: 'POST' }); if (r.aplicadas?.length) avisar('Banco de dados preparado.'); } catch { return; }
  try { categorias = await api('categorias'); } catch { return; }
  $('telaLogin').hidden = true; $('telaAdmin').hidden = false;
  modelos = await api('modelos');
  abrirAba(location.hash.slice(1) || 'pedidos');
}

// ---------- pedidos ----------
const NOMES_ST = { aguardando_pagamento: 'Aguardando pagamento', pago: 'Pago', publicado: 'Publicado', cancelado: 'Cancelado', aberto: 'Aberto', concluido: 'Concluído' };
$('filtroPedidos').onchange = carregarPedidos;
async function carregarPedidos() {
  const lista = $('listaPedidos'); lista.textContent = 'Carregando…';
  const ps = await api(`pedidos?status=${$('filtroPedidos').value}`);
  lista.textContent = '';
  if (!ps.length) return lista.append(el('p', { className: 'nota', textContent: 'Nenhum pedido ainda. Quando alguém montar um convite, ele aparece aqui.' }));
  ps.forEach(p => {
    const urlConvite = `${location.origin}/c/${p.slug}`, urlPainel = `${location.origin}/painel?c=${p.slug}&k=${p.token_painel}`;
    const sel = el('select', { 'aria-label': 'Status' }, ...['aguardando_pagamento', 'pago', 'publicado', 'cancelado'].map(s => new Option(NOMES_ST[s], s, false, s === p.status)));
    sel.onchange = async () => {
      if (sel.value === 'pago' && !confirm(`Marcar como pago? O cliente recebe o link por e-mail (${p.cliente_email}).`)) { sel.value = p.status; return; }
      await api('pedidos', { metodo: 'PATCH', corpo: { id: p.id, status: sel.value } }); avisar(sel.value === 'pago' ? 'Marcado como pago. E-mail enviado.' : 'Status atualizado.'); carregarPedidos();
    };
    const msg = `Olá, ${p.cliente_nome}! Seu convite está pronto:\n${urlConvite}\n\nPara ver quem confirmou presença:\n${urlPainel}`;
    const acoes = el('div', { className: 'acoes' },
      el('a', { className: 'chip', href: urlConvite, target: '_blank', textContent: 'Abrir convite' }),
      el('a', { className: 'chip', href: urlPainel, target: '_blank', textContent: 'Confirmações' }),
      el('a', { className: 'chip', href: zapLink(p.cliente_whatsapp, msg), target: '_blank', textContent: 'Chamar no WhatsApp' }));
    if (p.status === 'pago' || p.status === 'publicado') {
      const re = el('button', { className: 'chip', textContent: p.email_enviado_em ? 'Reenviar e-mail' : 'Enviar e-mail' });
      re.onclick = async () => { try { await api('pedidos', { metodo: 'PATCH', corpo: { id: p.id, reenviarEmail: true } }); avisar(`E-mail enviado para ${p.cliente_email}.`); } catch (err) { avisar(err.message); } };
      acoes.append(re);
    }
    if (p.musica === 'personalizada') {
      const inp = el('input', { placeholder: 'Link do MP3 da música', 'aria-label': 'Link da música personalizada', value: p.musica_url || '' });
      const bt = el('button', { className: 'chip', textContent: 'Salvar música' });
      bt.onclick = async () => { await api('pedidos', { metodo: 'PATCH', corpo: { id: p.id, musica_url: inp.value.trim() } }); avisar('Música salva no convite.'); };
      acoes.append(inp, bt);
    }
    lista.append(el('div', { className: 'item-adm' },
      el('div', {}, el('h3', { textContent: `${p.homenageado}${p.tipo === 'especial' ? ' · especial' : ''}` }),
        el('div', { className: 'meta', textContent: `${p.cliente_nome} · ${p.cliente_email} · festa ${dataBR(p.data)} · pedido ${dataBR(p.criado_em)}${p.musica === 'personalizada' ? ' · com música personalizada' : ''}` })),
      el('div', { style: 'display:flex;gap:10px;align-items:center' }, el('span', { className: 'valor-adm', textContent: reais(p.valor_centavos) }), sel),
      acoes));
  });
}

// ---------- especiais ----------
$('novoEspecial').onclick = () => {
  $('formEspecial').hidden = false; $('espCliente').focus();
  const s = $('espModelo'); s.length = 1;
  modelos.filter(m => m.ativo).forEach(m => s.append(new Option(`${m.nome}${m.exclusivo ? ' (exclusivo)' : ''}`, m.id)));
};
$('cancelarEspecial').onclick = () => { $('formEspecial').hidden = true; $('formEspecial').reset(); };
$('formEspecial').onsubmit = async e => {
  e.preventDefault(); $('erroEspecial').hidden = true;
  try {
    await api('especiais', { metodo: 'POST', corpo: { cliente_nome: $('espCliente').value, cliente_whatsapp: $('espZap').value, cliente_email: $('espEmail').value, descricao: $('espDesc').value, valor: $('espValor').value, modelo_id: $('espModelo').value, observacoes: $('espObs').value } });
    $('formEspecial').reset(); $('formEspecial').hidden = true; avisar('Pedido especial criado. Agora é só mandar o link.'); carregarEspeciais();
  } catch (err) { $('erroEspecial').textContent = err.message; $('erroEspecial').hidden = false; }
};
async function carregarEspeciais() {
  const lista = $('listaEspeciais'); lista.textContent = 'Carregando…';
  const es = await api('especiais'); lista.textContent = '';
  if (!es.length) return lista.append(el('p', { className: 'nota', textContent: 'Nenhum pedido especial ainda.' }));
  es.forEach(p => {
    const link = `${location.origin}/criar?pedido=${p.token}`;
    const st = el('select', { 'aria-label': 'Status' }, ...['aberto', 'aguardando_pagamento', 'pago', 'concluido', 'cancelado'].map(s => new Option(NOMES_ST[s], s, false, s === p.status)));
    st.onchange = async () => { await api('especiais', { metodo: 'PATCH', corpo: { id: p.id, status: st.value } }); avisar('Status atualizado.'); };
    const mod = el('select', { 'aria-label': 'Modelo' }, new Option('Cliente escolhe na vitrine', ''), ...modelos.map(m => new Option(`${m.nome}${m.exclusivo ? ' (exclusivo)' : ''}`, m.id, false, m.id === p.modelo_id)));
    mod.onchange = async () => { await api('especiais', { metodo: 'PATCH', corpo: { id: p.id, modelo_id: mod.value } }); avisar('Modelo do pedido atualizado.'); };
    const copiar = el('button', { className: 'chip', textContent: 'Copiar link' });
    copiar.onclick = () => navigator.clipboard.writeText(link).then(() => avisar('Link copiado.'));
    const acoes = el('div', { className: 'acoes' }, copiar, mod);
    if (p.cliente_whatsapp) acoes.append(el('a', { className: 'chip', target: '_blank', href: zapLink(p.cliente_whatsapp, `Olá, ${p.cliente_nome}! Aqui está o link para montar o seu convite: ${link}`), textContent: 'Mandar no WhatsApp' }));
    lista.append(el('div', { className: 'item-adm' },
      el('div', {}, el('h3', { textContent: p.cliente_nome }), el('div', { className: 'meta', textContent: p.descricao }), p.observacoes ? el('div', { className: 'meta', textContent: `Obs.: ${p.observacoes}` }) : null),
      el('div', { style: 'display:flex;gap:10px;align-items:center' }, el('span', { className: 'valor-adm', textContent: reais(p.valor_centavos) }), st),
      acoes));
  });
}

// ---------- categorias ----------
$('formCat').onsubmit = async e => {
  e.preventDefault();
  try { await api('categorias', { metodo: 'POST', corpo: { nome: $('novaCat').value } }); $('novaCat').value = ''; avisar('Categoria criada.'); carregarCats(); }
  catch (err) { avisar(err.message); }
};
async function carregarCats() {
  categorias = await api('categorias');
  const lista = $('listaCats'); lista.textContent = '';
  categorias.forEach((c, i) => {
    const nome = el('input', { value: c.nome, 'aria-label': 'Nome da categoria' });
    nome.onchange = async () => { await api('categorias', { metodo: 'PATCH', corpo: { id: c.id, nome: nome.value } }); avisar('Nome salvo.'); };
    const mover = d => async () => {
      if (!categorias[i + d]) return;
      const nova = [...categorias]; [nova[i], nova[i + d]] = [nova[i + d], nova[i]];
      await Promise.all(nova.map((x, n) => x.ordem === n ? null : api('categorias', { metodo: 'PATCH', corpo: { id: x.id, ordem: n } })));
      carregarCats();
    };
    const ativa = el('button', { className: 'chip', textContent: c.ativa ? 'Visível' : 'Oculta' });
    ativa.onclick = async () => { await api('categorias', { metodo: 'PATCH', corpo: { id: c.id, ativa: !c.ativa } }); carregarCats(); };
    const apagar = el('button', { className: 'chip perigo', textContent: 'Excluir' });
    apagar.onclick = async () => { if (!confirm(`Excluir a categoria "${c.nome}"?`)) return; try { await api(`categorias?id=${c.id}`, { metodo: 'DELETE' }); carregarCats(); } catch (err) { avisar(err.message); } };
    const qtd = modelos.filter(m => m.categoria_id === c.id).length;
    lista.append(el('div', { className: 'item-adm' }, nome, el('span', { className: 'meta', textContent: `${qtd} ${qtd === 1 ? 'modelo' : 'modelos'}` }),
      el('div', { className: 'acoes' }, el('button', { className: 'chip', textContent: 'Subir', onclick: mover(-1) }), el('button', { className: 'chip', textContent: 'Descer', onclick: mover(1) }), ativa, apagar)));
  });
}

// ---------- modelos ----------
async function carregarModelos() {
  [modelos, categorias] = await Promise.all([api('modelos'), api('categorias')]);
  const g = $('gradeModelos'); g.textContent = '';
  modelos.forEach(m => {
    const nome = el('input', { value: m.nome, 'aria-label': 'Nome do modelo' });
    nome.onchange = () => salvarModelo(m, { nome: nome.value });
    const cat = selCategorias(m.categoria_id); cat.onchange = () => salvarModelo(m, { categoria_id: cat.value });
    const tg = (rot, campo, sim, nao) => { const b = el('button', { className: 'chip', textContent: m[campo] ? sim : nao }); b.onclick = () => salvarModelo(m, { [campo]: !m[campo] }, true); return b; };
    const apagar = el('button', { className: 'chip perigo', textContent: 'Excluir' });
    apagar.onclick = async () => {
      if (!confirm(`Excluir o modelo "${m.nome}"?`)) return;
      const r = await api(`modelos?id=${m.id}`, { metodo: 'DELETE' });
      avisar(r.desativado ? 'Esse modelo já foi usado em convites, então só saiu da vitrine.' : 'Modelo excluído.'); carregarModelos();
    };
    g.append(el('div', { className: `cartao-mod${m.ativo ? '' : ' inativo'}` }, el('img', { src: m.poster_url, alt: '', loading: 'lazy' }),
      el('div', { className: 'corpo' }, nome, cat, el('div', { className: 'tags' }, tg('', 'ativo', 'Na vitrine', 'Fora da vitrine'), tg('', 'exclusivo', 'Exclusivo', 'Público'), apagar))));
  });
}
async function salvarModelo(m, campos, recarregar) {
  try { await api('modelos', { metodo: 'PATCH', corpo: { id: m.id, ...campos } }); Object.assign(m, campos); avisar('Modelo salvo.'); if (recarregar) carregarModelos(); }
  catch (err) { avisar(err.message); }
}
function selCategorias(atual) {
  const s = el('select', { 'aria-label': 'Categoria' }, new Option('Sem categoria', ''), ...categorias.map(c => new Option(c.nome, c.id, false, c.id === atual)));
  return s;
}

// ---------- editor de modelo novo ----------
const FPS = 24, ed = { arquivo: null, det: null, manual: null, total: 0 };
const edV = $('edVideo');
const modeloEd = { id: 'novo', fps: FPS, inicio: 1e9, quadros: [[0, 0, 0, 0]], forma: 'retangulo', chave: true, mascara: null };
let edComp;

$('novoModelo').onclick = () => {
  $('editor').hidden = false; $('editor').scrollIntoView({ behavior: 'smooth' });
  const s = $('edCat'); s.length = 0;
  categorias.forEach(c => s.append(new Option(c.nome, c.id)));
  s.append(new Option('+ Nova categoria…', '__nova'));
};
$('edCat').onchange = async e => {
  if (e.target.value !== '__nova') return;
  const nome = prompt('Nome da nova categoria:');
  if (!nome) { e.target.selectedIndex = 0; return; }
  try {
    const c = await api('categorias', { metodo: 'POST', corpo: { nome } }); categorias.push(c);
    e.target.add(new Option(c.nome, c.id, true, true), e.target.length - 1); avisar('Categoria criada.');
  } catch (err) { avisar(err.message); e.target.selectedIndex = 0; }
};
$('edFecharBt').onclick = () => { $('editor').hidden = true; edV.pause(); };

$('edArquivo').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  ed.arquivo = f; ed.det = null; ed.manual = null; $('edPublicar').disabled = true; $('edErro').hidden = true;
  if (!$('edNome').value) $('edNome').value = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 40);
  edV.src = URL.createObjectURL(f);
  await new Promise((ok, er) => { edV.onloadeddata = ok; edV.onerror = () => er(); }).catch(() => { erroEd('Não consegui abrir esse vídeo. Use MP4 (H.264).'); throw 0; });
  const prop = edV.videoWidth / edV.videoHeight;
  $('edInfo').textContent = `${edV.videoWidth}×${edV.videoHeight}, ${edV.duration.toFixed(1)} s, ${(f.size / 1048576).toFixed(1)} MB` + (Math.abs(prop - 9 / 16) > .03 ? '. Atenção: o vídeo não é 9:16, vai aparecer cortado.' : '');
  if (f.size > 90 * 1048576) erroEd('Vídeo acima de 90 MB. Exporte em 720p com compressão antes de enviar.');
  else if (f.size > 15 * 1048576) $('edInfo').textContent += '. Dica: exportar em 720p deixa o convite abrindo mais rápido.';
  ed.total = Math.floor(edV.duration * FPS);
  if (!edComp) { edComp = new Compositor($('edCanvas'), edV, modeloEd); edComp.definirFoto(fotoExemplo()); }
  modeloEd.inicio = 1e9; edV.play().catch(() => {});
  $('edDeteccao').hidden = false;
  detectar();
};

async function detectar() {
  $('edErro').hidden = true; $('edPublicar').disabled = true; $('edCampoInicio').hidden = true;
  $('edStatus').textContent = 'Procurando a moldura branca…'; $('edBarra').hidden = false;
  const v2 = el('video', { muted: true, playsInline: true, preload: 'auto', src: edV.src });
  await new Promise(ok => v2.addEventListener('loadeddata', ok, { once: true }));
  try {
    const r = await new Rastreador(v2).rodar({
      limiar: +$('edLimiar').value, sat: +$('edSat').value, fechar: $('edFechar').checked,
      progresso: p => $('edBarra').firstElementChild.style.width = `${Math.round(p * 100)}%`,
    });
    ed.det = r; ed.manual = null;
    configurarInicio(r.inicio / FPS);
    $('edStatus').textContent = `Moldura encontrada. A foto aparece em ${(r.inicio / FPS).toFixed(1)} s. Confira na prévia.`;
    $('edPublicar').disabled = false; verFoto();
  } catch (err) {
    $('edStatus').textContent = '';
    erroEd(`${err.message} Ajuste a sensibilidade em "A moldura não ficou certa?" ou marque a moldura na mão.`);
    document.querySelector('.avancado').open = true;
  } finally { $('edBarra').hidden = true; }
}
function configurarInicio(min) {
  const s = $('edInicio'); s.min = min.toFixed(2); s.max = ((ed.total - 1) / FPS).toFixed(2); s.value = min.toFixed(2);
  $('edCampoInicio').hidden = false; aplicarInicio();
}
function aplicarInicio() {
  const ini = Math.round(+$('edInicio').value * FPS);
  $('edInicioTxt').textContent = `${(ini / FPS).toFixed(1)} s`;
  if (ed.manual) { modeloEd.inicio = ini; modeloEd.quadros = [ed.manual]; }
  else if (ed.det) { modeloEd.inicio = ini; modeloEd.quadros = ed.det.quadros.slice(ini - ed.det.inicio); }
  edComp?.desenhar();
}
$('edInicio').oninput = aplicarInicio;
$('edInicio').onchange = verFoto;
$('edForma').onchange = e => { modeloEd.forma = e.target.value; edComp?.desenhar(); };
$('edChave').onchange = e => { modeloEd.chave = e.target.checked; edComp?.desenhar(); };
$('edLimiar').oninput = e => $('edLimiarTxt').textContent = e.target.value;
$('edSat').oninput = e => $('edSatTxt').textContent = e.target.value;
$('edDetectar').onclick = () => { sairManual(); detectar(); };
function verFoto() { edV.currentTime = Math.min(edV.duration - .3, modeloEd.inicio / FPS + .3); edV.play().catch(() => {}); }
$('edVerFoto').onclick = verFoto;
$('edDoInicio').onclick = () => { edV.currentTime = 0; edV.play().catch(() => {}); };
function erroEd(t) { $('edErro').textContent = t; $('edErro').hidden = false; }

// marcação manual: arrastar um retângulo sobre o último quadro
const mc = $('edMarcar');
$('edManual').onclick = () => {
  if (!ed.arquivo) return erroEd('Escolha o vídeo primeiro.');
  edV.pause(); edV.currentTime = edV.duration - .05;
  mc.hidden = false; $('edManualAjuda').hidden = false;
  mc.width = mc.clientWidth; mc.height = mc.clientHeight;
  mc.scrollIntoView({ behavior: 'smooth', block: 'center' });
  avisar('Arraste sobre a prévia para marcar a moldura.');
};
function sairManual() { mc.hidden = true; $('edManualAjuda').hidden = true; }
let arrasto = null;
const pos = e => { const r = mc.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
mc.onpointerdown = e => { mc.setPointerCapture(e.pointerId); arrasto = [pos(e), pos(e)]; };
mc.onpointermove = e => {
  if (!arrasto) return; arrasto[1] = pos(e);
  const g = mc.getContext('2d'), [[a, b], [c, d]] = arrasto; g.clearRect(0, 0, mc.width, mc.height);
  g.strokeStyle = '#E8336D'; g.lineWidth = 3; g.setLineDash([8, 6]); g.strokeRect(Math.min(a, c) * mc.width, Math.min(b, d) * mc.height, Math.abs(c - a) * mc.width, Math.abs(d - b) * mc.height);
};
mc.onpointerup = () => {
  if (!arrasto) return; const [[a, b], [c, d]] = arrasto; arrasto = null;
  if (Math.abs(c - a) < .05 || Math.abs(d - b) < .05) return;
  ed.manual = [Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b)].map(n => +n.toFixed(4));
  ed.det = null; sairManual();
  configurarInicio(0); $('edInicio').value = Math.max(0, (ed.total - 2 * FPS) / FPS).toFixed(2); aplicarInicio();
  $('edStatus').textContent = 'Moldura marcada. Escolha a partir de quando a foto aparece.'; $('edErro').hidden = true;
  $('edPublicar').disabled = false; verFoto();
};

function enviarArquivo(url, corpo, tipo, aoProgredir) {
  return new Promise((ok, er) => {
    const x = new XMLHttpRequest(); x.open('PUT', url); x.setRequestHeader('content-type', tipo);
    x.upload.onprogress = e => e.lengthComputable && aoProgredir?.(e.loaded / e.total);
    x.onload = () => x.status < 300 ? ok() : er(new Error(`Falha no envio (${x.status}).`)); x.onerror = () => er(new Error('Falha de conexão no envio.'));
    x.send(corpo);
  });
}
async function gerarCapa() {
  const v = el('video', { muted: true, playsInline: true, preload: 'auto', src: edV.src });
  await new Promise(ok => v.addEventListener('loadeddata', ok, { once: true }));
  await new Promise(ok => { v.addEventListener('seeked', ok, { once: true }); v.currentTime = Math.min(1.2, v.duration / 2); });
  const c = el('canvas', { width: 480, height: 854 }); c.getContext('2d').drawImage(v, 0, 0, 480, 854);
  return new Promise(ok => c.toBlob(ok, 'image/jpeg', .82));
}

$('edPublicar').onclick = async () => {
  const nome = $('edNome').value.trim();
  if (!nome) { $('edNome').focus(); return erroEd('Dê um nome ao modelo.'); }
  if ($('edCat').value === '__nova') return erroEd('Escolha a categoria.');
  const bt = $('edPublicar'); bt.disabled = true; $('edErro').hidden = true;
  try {
    bt.textContent = 'Preparando…';
    const links = await api('envio', { metodo: 'POST', corpo: { tipoVideo: ed.arquivo.type } });
    await enviarArquivo(links.video.envio, ed.arquivo, ed.arquivo.type || 'video/mp4', p => bt.textContent = `Enviando vídeo ${Math.round(p * 100)}%`);
    bt.textContent = 'Enviando capa…';
    await enviarArquivo(links.capa.envio, await gerarCapa(), 'image/jpeg');
    bt.textContent = 'Salvando…';
    await api('modelos', { metodo: 'POST', corpo: {
      id: links.id, nome, categoria_id: $('edCat').value, video_url: links.video.publico, poster_url: links.capa.publico,
      inicio: modeloEd.inicio, quadros: modeloEd.quadros, forma: modeloEd.forma, chave: modeloEd.chave, exclusivo: $('edExclusivo').checked,
    } });
    avisar($('edExclusivo').checked ? 'Modelo exclusivo publicado. Escolha ele no pedido especial.' : 'Modelo publicado na vitrine.');
    $('editor').hidden = true; edV.pause(); $('edArquivo').value = ''; $('edNome').value = ''; $('edDeteccao').hidden = true;
    carregarModelos();
  } catch (err) { erroEd(err.message); }
  finally { bt.disabled = false; bt.textContent = 'Publicar modelo'; }
};

// ---------- configurações ----------
const formatarZap = d => d ? `(${d.slice(2, 4)}) ${d.slice(4, -4)}-${d.slice(-4)}` : '';
function mostrarConfig(c) {
  $('cfgZap').value = formatarZap(c.whatsapp);
  $('cfgTestar').hidden = !c.whatsapp; $('cfgTestar').href = c.whatsapp ? `https://wa.me/${c.whatsapp}` : '#';
}
async function carregarConfigAdm() { mostrarConfig(await api('config')); }
$('formConfig').onsubmit = async e => {
  e.preventDefault(); $('erroConfig').hidden = true;
  try { mostrarConfig(await api('config', { metodo: 'PATCH', corpo: { whatsapp: $('cfgZap').value } })); avisar('Configurações salvas. O site atualiza em até 1 minuto.'); }
  catch (err) { $('erroConfig').textContent = err.message; $('erroConfig').hidden = false; }
};

iniciar();
