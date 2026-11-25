import { Compositor, fotoExemplo } from './compositor.js?v=0877c4a5';
import { Rastreador } from './rastreador.js?v=d941cc90';
import { reais } from './config.js?v=12104be8';
import { ESTILOS } from './estilos.js?v=d5c0644b';

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
    const editar = el('button', { className: 'chip chip-forte', textContent: 'Editar moldura' });
    editar.onclick = () => abrirEdicao(m);
    const apagar = el('button', { className: 'chip perigo', textContent: 'Excluir' });
    apagar.onclick = async () => {
      if (!confirm(`Excluir o modelo "${m.nome}"?`)) return;
      const r = await api(`modelos?id=${m.id}`, { metodo: 'DELETE' });
      avisar(r.desativado ? 'Esse modelo já foi usado em convites, então só saiu da vitrine.' : 'Modelo excluído.'); carregarModelos();
    };
    g.append(el('div', { className: `cartao-mod${m.ativo ? '' : ' inativo'}` }, el('img', { src: m.poster_url, alt: '', loading: 'lazy' }),
      el('div', { className: 'corpo' }, nome, cat, el('div', { className: 'tags' }, editar, tg('', 'ativo', 'Na vitrine', 'Fora da vitrine'), tg('', 'exclusivo', 'Exclusivo', 'Público'), apagar))));
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
const FPS = 24, ed = { arquivo: null, det: null, manual: null, total: 0, editando: null };
const edV = $('edVideo');
const modeloEd = { id: 'novo', fps: FPS, inicio: 1e9, quadros: [[0, 0, 0, 0]], forma: 'retangulo', chave: true, mascara: null, tipo: 'foto' };
let formaEscolhida = 'auto', mascaraBlob = null;
const ehSelo = () => modeloEd.tipo === 'selo';
let edComp;

ESTILOS.forEach(e => $('edEstilo').append(new Option(`${e.nome}${e.grupo === 'casamento' ? ' (casamento)' : ''}`, e.id)));
function prepararCategorias() {
  const s = $('edCat'); s.length = 0;
  categorias.forEach(c => s.append(new Option(c.nome, c.id)));
  s.append(new Option('+ Nova categoria…', '__nova'));
}
$('novoModelo').onclick = () => {
  if (ed.editando) { ed.editando = null; ed.arquivo = null; ed.det = null; ed.manual = null; $('edNome').value = ''; $('edDeteccao').hidden = true; $('edArquivo').closest('label').hidden = false; edV.removeAttribute('src'); }
  $('edTitulo').textContent = 'Vídeo novo'; $('edPublicar').textContent = 'Publicar modelo';
  $('editor').hidden = false; $('editor').scrollIntoView({ behavior: 'smooth' });
  prepararCategorias(); const s = $('edCat');
  if (ehSelo() && categorias.some(c => c.id === 'casamento')) s.value = 'casamento';
};
// (a lista de categorias do editor é montada em prepararCategorias)
$('edTipo').onchange = e => {
  modeloEd.tipo = e.target.value;
  const selo = ehSelo();
  $('edTipoAjuda').textContent = selo ? 'O vídeo começa parado no envelope com um selo liso (sem letras). As iniciais do casal entram no selo.' : 'O vídeo termina numa moldura branca onde entra a foto do cliente.';
  $('edCampoForma').hidden = selo; $('edChave').closest('label').hidden = selo;
  $('edInicioRot').textContent = selo ? 'As iniciais somem em' : 'Começar a foto em';
  // sensibilidade padrão: selo é creme/marfim, moldura é branca
  $('edLimiar').value = selo ? 190 : 225; $('edSat').value = selo ? 45 : 18;
  $('edLimiarTxt').textContent = $('edLimiar').value; $('edSatTxt').textContent = $('edSat').value;
  if (selo && categorias.some(c => c.id === 'casamento')) $('edCat').value = 'casamento';
  if (edComp) { if (selo) edComp.definirIniciais('L&R'); else edComp.definirFoto(fotoExemplo()); }
  if (ed.arquivo) { sairManual(); detectar(); }
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
  await carregarVideo(URL.createObjectURL(f));
  const prop = edV.videoWidth / edV.videoHeight;
  $('edInfo').textContent = `${edV.videoWidth}×${edV.videoHeight}, ${edV.duration.toFixed(1)} s, ${(f.size / 1048576).toFixed(1)} MB` + (Math.abs(prop - 9 / 16) > .03 ? '. Atenção: o vídeo não é 9:16, vai aparecer cortado.' : '');
  if (f.size > 90 * 1048576) erroEd('Vídeo acima de 90 MB. Exporte em 720p com compressão antes de enviar.');
  else if (f.size > 15 * 1048576) $('edInfo').textContent += '. Dica: exportar em 720p deixa o convite abrindo mais rápido.';
  prepararPrevia();
  modeloEd.inicio = 1e9; edV.play().catch(() => {});
  $('edDeteccao').hidden = false;
  detectar();
};
async function carregarVideo(src) {
  if (!src.startsWith('blob:')) edV.crossOrigin = 'anonymous'; else edV.removeAttribute('crossorigin');
  edV.src = src;
  await new Promise((ok, er) => { edV.onloadeddata = ok; edV.onerror = () => er(); }).catch(() => { erroEd('Não consegui abrir esse vídeo. Use MP4 (H.264).'); throw 0; });
}
function prepararPrevia() {
  ed.total = Math.floor(edV.duration * FPS);
  if (!edComp) edComp = new Compositor($('edCanvas'), edV, modeloEd);
  if (ehSelo()) edComp.definirIniciais('L&R'); else edComp.definirFoto(fotoExemplo());
}

// ---------- editar um modelo já publicado (sem enviar o vídeo de novo) ----------
async function abrirEdicao(m) {
  prepararCategorias(); sairManual();
  ed.editando = m; ed.arquivo = { existente: true }; ed.det = null; ed.manual = null; mascaraBlob = null;
  $('edTitulo').textContent = `Editando: ${m.nome}`; $('edPublicar').textContent = 'Salvar alterações';
  $('edArquivo').closest('label').hidden = true;
  $('edNome').value = m.nome; $('edCat').value = m.categoria_id || ''; $('edEstilo').value = m.estilo || ''; $('edExclusivo').checked = !!m.exclusivo;
  $('edTipo').value = m.tipo || 'foto'; modeloEd.tipo = $('edTipo').value;
  const selo = ehSelo();
  $('edCampoForma').hidden = selo; $('edChave').closest('label').hidden = selo;
  $('edInicioRot').textContent = selo ? 'As iniciais somem em' : 'A foto aparece em';
  $('edLimiar').value = selo ? 190 : 225; $('edSat').value = selo ? 45 : 18;
  $('edLimiarTxt').textContent = $('edLimiar').value; $('edSatTxt').textContent = $('edSat').value;
  formaEscolhida = m.forma === 'mascara' ? 'auto' : (m.forma || 'retangulo'); $('edForma').value = formaEscolhida;
  modeloEd.chave = !!m.chave; $('edChave').checked = !!m.chave;
  $('editor').hidden = false; $('editor').scrollIntoView({ behavior: 'smooth' });
  $('edErro').hidden = true; $('edStatus').textContent = 'Abrindo o vídeo…'; $('edDeteccao').hidden = false;
  try { await carregarVideo(m.video_url); } catch { return; }
  $('edInfo').textContent = `${edV.videoWidth}×${edV.videoHeight}, ${edV.duration.toFixed(1)} s`;
  prepararPrevia();
  const q = typeof m.quadros === 'string' ? JSON.parse(m.quadros) : m.quadros;
  modeloEd.forma = m.forma || 'retangulo'; modeloEd.mascara = m.mascara_url || null;
  if (modeloEd.mascara) edComp.definirMascara(modeloEd.mascara);
  if (selo) {
    ed.det = { quadros: q, inicio: 0 }; configurarFim(Math.max(q.length, ed.total - 1) / FPS, q.length / FPS);
  } else if (q.length === 1) {
    ed.manual = q[0]; ed.manualT = Math.min(edV.duration - .1, m.inicio / FPS + 1);
    configurarInicio(0); $('edInicio').value = (m.inicio / FPS).toFixed(2); aplicarInicio();
  } else {
    ed.det = { quadros: q, inicio: m.inicio }; configurarInicio(m.inicio / FPS);
  }
  $('edStatus').textContent = 'Modelo aberto. Use "Ajustar moldura" ou mude o momento da foto e toque em Salvar alterações.';
  $('edAjustar').hidden = false; $('edPublicar').disabled = false; mostrarMomento();
}

async function detectar() {
  $('edErro').hidden = true; $('edPublicar').disabled = true; $('edCampoInicio').hidden = true;
  $('edStatus').textContent = ehSelo() ? 'Procurando o selo…' : 'Procurando a moldura branca…'; $('edBarra').hidden = false;
  const v2 = el('video', { muted: true, playsInline: true, preload: 'auto', src: edV.src });
  await new Promise(ok => v2.addEventListener('loadeddata', ok, { once: true }));
  try {
    const opcoes = { limiar: +$('edLimiar').value, sat: +$('edSat').value, fechar: $('edFechar').checked,
      progresso: p => $('edBarra').firstElementChild.style.width = `${Math.round(p * 100)}%` };
    const rast = new Rastreador(v2);
    const r = ehSelo() ? await rast.rodarSelo(opcoes) : await rast.rodar(opcoes);
    ed.det = r; ed.manual = null;
    if (ehSelo()) {
      configurarFim(r.quadros.length / FPS, r.quadros.length / FPS);
      $('edStatus').textContent = `Selo encontrado. As iniciais ficam no selo até ${(r.quadros.length / FPS).toFixed(1)} s. Confira na prévia.`;
    } else {
      configurarInicio(r.inicio / FPS);
      $('edStatus').textContent = `Moldura encontrada. A foto aparece em ${(r.inicio / FPS).toFixed(1)} s. Confira na prévia.`;
      await aplicarForma();
    }
    $('edPublicar').disabled = false; $('edAjustar').hidden = false; verFoto();
  } catch (err) {
    $('edAjustar').hidden = false;
    $('edStatus').textContent = '';
    erroEd(`${err.message} Ajuste a sensibilidade em "A moldura não ficou certa?" ou marque ${ehSelo() ? 'o selo' : 'a moldura'} na mão.`);
    document.querySelector('.avancado').open = true;
  } finally { $('edBarra').hidden = true; }
}
function configurarInicio(min) {
  const s = $('edInicio'); s.min = min.toFixed(2); s.max = ((ed.total - 1) / FPS).toFixed(2); s.value = min.toFixed(2);
  $('edCampoInicio').hidden = false; aplicarInicio();
}
// selo: o controle define até quando as iniciais aparecem (o rastreio vai do começo até ali)
function configurarFim(max, valor) {
  const s = $('edInicio'); s.min = (.5).toFixed(2); s.max = max.toFixed(2); s.value = valor.toFixed(2);
  $('edCampoInicio').hidden = false; aplicarInicio();
}
function aplicarInicio() {
  if (ehSelo()) {
    const fim = Math.max(1, Math.round(+$('edInicio').value * FPS));
    $('edInicioTxt').textContent = `${(fim / FPS).toFixed(1)} s`;
    modeloEd.inicio = 0;
    modeloEd.quadros = ed.manual ? Array.from({ length: fim }, () => ed.manual) : (ed.det ? ed.det.quadros.slice(0, fim) : modeloEd.quadros);
    edComp?.desenhar(); return;
  }
  const ini = Math.round(+$('edInicio').value * FPS);
  $('edInicioTxt').textContent = `${(ini / FPS).toFixed(1)} s`;
  if (ed.manual) { modeloEd.inicio = ini; modeloEd.quadros = [ed.manual]; }
  else if (ed.det) { modeloEd.inicio = ini; modeloEd.quadros = ed.det.quadros.slice(ini - ed.det.inicio); }
  edComp?.desenhar();
}
$('edInicio').oninput = () => { aplicarInicio(); mostrarMomento(); };
$('edInicio').onchange = () => mostrarMomento();
// pausa a prévia no momento escolhido (com a foto já inteira) para conferir
function mostrarMomento() {
  if (ehSelo()) { edV.pause(); edV.currentTime = Math.max(0, +$('edInicio').value - .3); return; }
  edV.pause(); edV.currentTime = Math.min(edV.duration - .05, modeloEd.inicio / FPS + .45);
}
$('edForma').onchange = async e => { formaEscolhida = e.target.value; await aplicarForma(); edComp?.desenhar(); };

// ---------- quadro parado do vídeo (não depende do player da prévia) ----------
let vq = null;
async function quadroEm(t) {
  if (!vq || vq.src !== edV.src) {
    vq = el('video', { muted: true, playsInline: true, preload: 'auto', src: edV.src });
    await new Promise(ok => vq.addEventListener('loadeddata', ok, { once: true }));
  }
  t = Math.max(0, Math.min(vq.duration - .05, t));
  await new Promise(ok => { const fim = () => ok(); vq.addEventListener('seeked', fim, { once: true }); setTimeout(fim, 2500); vq.currentTime = t; });
  const c = el('canvas', { width: vq.videoWidth, height: vq.videoHeight }); c.getContext('2d').drawImage(vq, 0, 0); return c;
}

// ---------- formato automático: a foto ocupa só a área branca da moldura ----------
// Pega um quadro com a moldura inteira, acha a região branca ligada ao centro e
// fecha os buracos (confete, letras). Serve para círculo, coração, arco, qualquer forma.
function gerarMascara(quadro, r) {
  const N = 256, [x, y, w, h] = r, ix = w * .015, iy = h * .015;
  const c = el('canvas', { width: N, height: N }), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(quadro, (x + ix) * quadro.width, (y + iy) * quadro.height, (w - 2 * ix) * quadro.width, (h - 2 * iy) * quadro.height, 0, 0, N, N);
  const px = g.getImageData(0, 0, N, N).data, lim = +$('edLimiar').value - 20, sat = +$('edSat').value + 14;
  const branco = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) { const a = px[i * 4], b = px[i * 4 + 1], d = px[i * 4 + 2], mn = Math.min(a, b, d), mx = Math.max(a, b, d); branco[i] = mn >= lim && mx - mn <= sat ? 1 : 0; }
  // ponto branco mais perto do centro
  let ini = -1;
  for (let raio = 0; raio < N * .3 && ini < 0; raio += 2) for (let a = 0; a < 6.3 && ini < 0; a += .2) {
    const cx = Math.round(N / 2 + Math.cos(a) * raio), cy = Math.round(N / 2 + Math.sin(a) * raio);
    if (cx >= 0 && cy >= 0 && cx < N && cy < N && branco[cy * N + cx]) ini = cy * N + cx;
  }
  if (ini < 0) return null;
  const encher = (sementes, pode) => { const v = new Uint8Array(N * N), fila = [...sementes]; sementes.forEach(i => v[i] = 1);
    while (fila.length) { const i = fila.pop(), cx = i % N, cy = (i / N) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const j = ny * N + nx; if (!v[j] && pode(j)) { v[j] = 1; fila.push(j); } } }
    return v; };
  const regiao = encher([ini], j => branco[j]);
  // fora = tudo que chega na borda sem passar pela região; o resto (incluindo buracos) é a forma
  const borda = []; for (let i = 0; i < N; i++) [i, (N - 1) * N + i, i * N, i * N + N - 1].forEach(j => !regiao[j] && borda.push(j));
  const fora = encher(borda, j => !regiao[j]);
  let area = 0; const out = g.createImageData(N, N);
  for (let i = 0; i < N * N; i++) { const v = fora[i] ? 0 : 255; area += v ? 1 : 0; out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = v; out.data[i * 4 + 3] = 255; }
  area /= N * N;
  if (area < .2) return null;          // achou pouca coisa: melhor não arriscar
  if (area > .96) return 'retangulo';  // já é praticamente um retângulo
  g.putImageData(out, 0, 0);
  const f = el('canvas', { width: N, height: N }), gf = f.getContext('2d'); gf.filter = 'blur(1.2px)'; gf.drawImage(c, 0, 0);
  return f;
}
async function aplicarForma() {
  mascaraBlob = null; modeloEd.mascara = null;
  if (ehSelo()) return;
  if (formaEscolhida !== 'auto') { modeloEd.forma = formaEscolhida; return; }
  modeloEd.forma = 'retangulo';
  const r = ed.manual || modeloEd.quadros[modeloEd.quadros.length - 1];
  if (!r || !r[2]) return;
  const t = ed.manual ? ed.manualT : (ed.total - 2) / FPS;
  try {
    const m = gerarMascara(await quadroEm(t), r);
    if (!m) { $('edStatus').textContent += ' Formato: não deu para ler o contorno, usei retângulo.'; return; }
    if (m === 'retangulo') { $('edStatus').textContent += ' Formato: retângulo.'; return; }
    mascaraBlob = await new Promise(ok => m.toBlob(ok, 'image/png'));
    modeloEd.forma = 'mascara'; modeloEd.mascara = m.toDataURL('image/png');
    edComp?.definirMascara(modeloEd.mascara);
    $('edStatus').textContent += ' Formato: segue o contorno da moldura.';
  } catch { modeloEd.forma = 'retangulo'; }
}
$('edChave').onchange = e => { modeloEd.chave = e.target.checked; edComp?.desenhar(); };
$('edLimiar').oninput = e => $('edLimiarTxt').textContent = e.target.value;
$('edSat').oninput = e => $('edSatTxt').textContent = e.target.value;
$('edDetectar').onclick = () => { sairManual(); detectar(); };
function verFoto() {
  if (ehSelo()) { edV.currentTime = 0; edV.play().catch(() => {}); return; }
  edV.currentTime = Math.min(edV.duration - .3, modeloEd.inicio / FPS + .3); edV.play().catch(() => {});
}
$('edVerFoto').onclick = verFoto;
$('edDoInicio').onclick = () => { edV.currentTime = 0; edV.play().catch(() => {}); };
function erroEd(t) { $('edErro').textContent = t; $('edErro').hidden = false; }

// marcação manual: retângulo sobre um quadro parado; depois de marcar dá para mover e redimensionar
const mc = $('edMarcar');
let marca = null, gesto = null, fundo = null;   // marca = [x, y, w, h] normalizado
async function abrirMarcacao() {
  if (!ed.arquivo) return erroEd('Escolha o vídeo primeiro.');
  edV.pause();
  mc.hidden = false; $('edManualAjuda').hidden = false; $('edQuadroBox').hidden = false;
  const dpr = Math.min(2, devicePixelRatio || 1); mc.width = mc.clientWidth * dpr; mc.height = mc.clientHeight * dpr;
  const q = $('edQuadro'); q.max = Math.max(0, edV.duration - .1).toFixed(2);
  // começa da marcação atual (manual ou a detectada), se houver
  marca = ed.manual ? [...ed.manual] : (!ehSelo() && ed.det ? [...modeloEd.quadros[modeloEd.quadros.length - 1]] : (ehSelo() && ed.det ? [...ed.det.quadros[0]] : null));
  q.value = (ed.manual ? ed.manualT : ehSelo() ? 0 : Math.max(0, edV.duration - .3)).toFixed(2);
  $('edQuadroPronto').disabled = !marca;
  await mostrarQuadro();
  mc.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
$('edManual').onclick = abrirMarcacao;
$('edAjustar').onclick = abrirMarcacao;
function sairManual() { mc.hidden = true; $('edManualAjuda').hidden = true; $('edQuadroBox').hidden = true; gesto = null; }
$('edQuadroSair').onclick = sairManual;
async function mostrarQuadro() {
  const t = +$('edQuadro').value; $('edQuadroTxt').textContent = `${t.toFixed(1)} s`;
  fundo = await quadroEm(t); pintarMarca();
}
$('edQuadro').oninput = () => mostrarQuadro();
const cantos = m => [[m[0], m[1]], [m[0] + m[2], m[1]], [m[0], m[1] + m[3]], [m[0] + m[2], m[1] + m[3]]];
function pintarMarca() {
  const g = mc.getContext('2d'), W = mc.width, H = mc.height, k = W / mc.clientWidth;
  g.clearRect(0, 0, W, H);
  if (fundo) g.drawImage(fundo, 0, 0, W, H);
  if (!marca) return;
  const [x, y, w, h] = marca;
  // escurece fora da marcação para ver bem a área escolhida
  g.fillStyle = 'rgba(20,8,26,.45)'; g.beginPath(); g.rect(0, 0, W, H); g.rect(x * W, y * H, w * W, h * H); g.fill('evenodd');
  g.setLineDash([8 * k, 6 * k]); g.strokeStyle = '#E8336D'; g.lineWidth = 2.5 * k; g.strokeRect(x * W, y * H, w * W, h * H); g.setLineDash([]);
  for (const [cx, cy] of cantos(marca)) { g.beginPath(); g.arc(cx * W, cy * H, 9 * k, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 3 * k; g.strokeStyle = '#E8336D'; g.stroke(); }
}
const pos = e => { const r = mc.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
mc.onpointerdown = e => {
  e.preventDefault(); mc.setPointerCapture(e.pointerId);
  const [px, py] = pos(e), r = mc.getBoundingClientRect(), perto = 26, antes = marca && [...marca];
  if (marca) {
    // canto mais perto (alvo grande para o dedo)
    const c = cantos(marca).map(([cx, cy], i) => [Math.hypot((cx - px) * r.width, (cy - py) * r.height), i]).sort((a, b) => a[0] - b[0])[0];
    if (c[0] < perto) { const fixo = cantos(marca)[3 - c[1]]; gesto = { tipo: 'canto', fixo, antes }; return; }
    const [x, y, w, h] = marca;
    if (px > x && px < x + w && py > y && py < y + h) { gesto = { tipo: 'mover', ini: [px, py], orig: [...marca] }; return; }
  }
  gesto = { tipo: 'canto', fixo: [px, py], antes }; marca = [px, py, 0, 0];
};
mc.onpointermove = e => {
  if (!gesto) return; e.preventDefault();
  const [px, py] = pos(e);
  if (gesto.tipo === 'mover') {
    const [x, y, w, h] = gesto.orig;
    marca = [Math.min(1 - w, Math.max(0, x + px - gesto.ini[0])), Math.min(1 - h, Math.max(0, y + py - gesto.ini[1])), w, h];
  } else {
    const [fx, fy] = gesto.fixo; marca = [Math.min(fx, px), Math.min(fy, py), Math.abs(px - fx), Math.abs(py - fy)];
  }
  pintarMarca();
};
const fimGesto = () => {
  if (!gesto) return;
  // marcação pequena demais (toque sem arrastar, canto puxado além do outro): volta para a anterior
  if (marca && (marca[2] < .04 || marca[3] < .03)) marca = gesto.antes || null;
  gesto = null;
  $('edQuadroPronto').disabled = !marca; pintarMarca();
};
mc.onpointerup = fimGesto; mc.onpointercancel = fimGesto;

$('edQuadroPronto').onclick = async () => {
  if (!marca) return;
  ed.manual = marca.map(n => +n.toFixed(4));
  ed.manualT = +$('edQuadro').value;
  ed.det = null; sairManual();
  if (ehSelo()) {
    configurarFim((ed.total - 1) / FPS, Math.min(2.5, (ed.total - 1) / FPS));
    $('edStatus').textContent = 'Selo marcado. Escolha até quando as iniciais aparecem (antes do selo quebrar).';
  } else {
    configurarInicio(0); $('edInicio').value = Math.max(0, Math.min(ed.manualT, (ed.total - 2 * FPS) / FPS)).toFixed(2); aplicarInicio();
    $('edStatus').textContent = 'Moldura marcada. Escolha a partir de quando a foto aparece.';
    await aplicarForma();
  }
  $('edDeteccao').hidden = false; $('edErro').hidden = true; $('edAjustar').hidden = false;
  $('edPublicar').disabled = false; mostrarMomento();
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
  if (ed.editando) return salvarEdicao(nome, bt);
  try {
    bt.textContent = 'Preparando…';
    const links = await api('envio', { metodo: 'POST', corpo: { tipoVideo: ed.arquivo.type } });
    await enviarArquivo(links.video.envio, ed.arquivo, ed.arquivo.type || 'video/mp4', p => bt.textContent = `Enviando vídeo ${Math.round(p * 100)}%`);
    bt.textContent = 'Enviando capa…';
    await enviarArquivo(links.capa.envio, await gerarCapa(), 'image/jpeg');
    let mascara_url = null;
    if (modeloEd.forma === 'mascara' && mascaraBlob) { bt.textContent = 'Enviando formato…'; await enviarArquivo(links.mascara.envio, mascaraBlob, 'image/png'); mascara_url = links.mascara.publico; }
    bt.textContent = 'Salvando…';
    await api('modelos', { metodo: 'POST', corpo: {
      id: links.id, nome, categoria_id: $('edCat').value, video_url: links.video.publico, poster_url: links.capa.publico,
      inicio: modeloEd.inicio, quadros: modeloEd.quadros, estilo: $('edEstilo').value, forma: ehSelo() ? 'circulo' : (mascara_url ? 'mascara' : modeloEd.forma === 'mascara' ? 'retangulo' : modeloEd.forma), mascara_url, chave: modeloEd.chave, exclusivo: $('edExclusivo').checked, tipo: modeloEd.tipo,
    } });
    avisar($('edExclusivo').checked ? 'Modelo exclusivo publicado. Escolha ele no pedido especial.' : 'Modelo publicado na vitrine.');
    $('editor').hidden = true; edV.pause(); $('edArquivo').value = ''; $('edNome').value = ''; $('edDeteccao').hidden = true;
    carregarModelos();
  } catch (err) { erroEd(err.message); }
  finally { bt.disabled = false; bt.textContent = 'Publicar modelo'; }
};

async function salvarEdicao(nome, bt) {
  const m = ed.editando;
  try {
    let mascara_url = modeloEd.forma === 'mascara' ? m.mascara_url : null;
    if (modeloEd.forma === 'mascara' && mascaraBlob) {
      bt.textContent = 'Enviando formato…';
      const links = await api('envio', { metodo: 'POST', corpo: { id: m.id } });
      await enviarArquivo(links.mascara.envio, mascaraBlob, 'image/png'); mascara_url = links.mascara.publico;
    }
    bt.textContent = 'Salvando…';
    await api('modelos', { metodo: 'PATCH', corpo: {
      id: m.id, nome, categoria_id: $('edCat').value, estilo: $('edEstilo').value, exclusivo: $('edExclusivo').checked, chave: modeloEd.chave,
      quadros: modeloEd.quadros, inicio: modeloEd.inicio, aplicarMoldura: true,
      forma: ehSelo() ? 'circulo' : (mascara_url ? 'mascara' : modeloEd.forma === 'mascara' ? 'retangulo' : modeloEd.forma), mascara_url,
    } });
    avisar('Alterações salvas. Os convites que usam esse modelo já mostram a moldura nova.');
    $('editor').hidden = true; edV.pause(); ed.editando = null; ed.arquivo = null; $('edArquivo').closest('label').hidden = false; $('edNome').value = ''; $('edDeteccao').hidden = true;
    $('edTitulo').textContent = 'Vídeo novo';
    carregarModelos();
  } catch (err) { erroEd(err.message); }
  finally { bt.disabled = false; bt.textContent = ed.editando ? 'Salvar alterações' : 'Publicar modelo'; }
}

// ---------- configurações ----------
const formatarZap = d => d ? `(${d.slice(2, 4)}) ${d.slice(4, -4)}-${d.slice(-4)}` : '';
const realBR = c => (c / 100).toFixed(2).replace('.', ',');
function mostrarConfig(c) {
  $('cfgZap').value = formatarZap(c.whatsapp);
  $('cfgPreco').value = realBR(+c.preco_convite); $('cfgMusica').value = realBR(+c.preco_musica); $('cfgCasamento').value = realBR(+c.preco_casamento);
  $('cfgTestar').hidden = !c.whatsapp; $('cfgTestar').href = c.whatsapp ? `https://wa.me/${c.whatsapp}` : '#';
}
async function carregarConfigAdm() { mostrarConfig(await api('config')); }
$('formConfig').onsubmit = async e => {
  e.preventDefault(); $('erroConfig').hidden = true;
  try { mostrarConfig(await api('config', { metodo: 'PATCH', corpo: { whatsapp: $('cfgZap').value, preco_convite: $('cfgPreco').value, preco_musica: $('cfgMusica').value, preco_casamento: $('cfgCasamento').value } })); avisar('Configurações salvas. O site atualiza em até 1 minuto.'); }
  catch (err) { $('erroConfig').textContent = err.message; $('erroConfig').hidden = false; }
};

iniciar();
