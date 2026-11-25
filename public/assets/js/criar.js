import { carregarModelos } from './compositor.js?v=31afcda2';
import { ESTILOS, FONTES, estiloPorId, personalizacaoPadrao, carregarFontes, ehCasamento } from './estilos.js?v=89817aef';
import { CONFIG, reais, ligarSuporte, ligarPrecos, carregarConfig } from './config.js?v=12104be8';

const $ = id => document.getElementById(id);
const qs = new URLSearchParams(location.search);
const [dados] = await Promise.all([carregarModelos(), carregarConfig()]);
ligarPrecos();
const slugEditar = qs.get('editar');
const tokenEspecial = qs.get('pedido');
let especial = null, existente = null;

function erroFatal(t) { document.querySelector('main').innerHTML = `<div style="text-align:center;padding:90px 0"><h1 style="font-size:2.2rem"></h1><p style="color:var(--tinta-2);margin-top:12px"><a data-zap="Olá! Preciso de ajuda com meu convite." hidden>Fale com a gente pelo WhatsApp</a></p></div>`; document.querySelector('main h1').textContent = t; ligarSuporte(); throw 0; }

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
let previaPronta = false, agendado, destinoPrevia;
function conectarPrevia() {
  previaPronta = typeof iframe.contentWindow?.atualizarPrevia === 'function';
  if (previaPronta) atualizar();
}
window.addEventListener('message', e => { if (e.source === iframe.contentWindow && e.origin === location.origin && e.data?.tipo === 'previa-pronta') conectarPrevia(); });
iframe.addEventListener('load', conectarPrevia);
function atualizar(destino) {
  if (destino) destinoPrevia = destino;
  clearTimeout(agendado);
  agendado = setTimeout(async () => {
    if (!previaPronta) return;
    const onde = destinoPrevia;
    destinoPrevia = null;
    try {
      await iframe.contentWindow.atualizarPrevia(dadosPrevia());
      if (onde) iframe.contentWindow.irPara?.(onde);
    } catch {
      mostrarErro('Não foi possível carregar a prévia. Tente outra abertura ou atualize a página.', false);
    }
  }, 120);
}
function dadosPrevia() {
  const v = id => $(id).value.trim();
  if (ehCasamento(modelo)) {
    pers.casal = { nome1: v('nome1'), nome2: v('nome2'), iniciais: v('iniciais') || iniciaisAuto() };
    pers.blocos.convite = { texto: v('recado'), versiculo: v('versiculo') };
    pers.encerramento = v('encerramento');
  }
  return {
    slug: 'previa', homenageado: ehCasamento(modelo) ? `${v('nome1') || 'Noiva'} & ${v('nome2') || 'Noivo'}` : (v('homenageado') || 'Nome'), idade: v('idade'), titulo: v('tituloConvite'),
    data: v('data') || proximoSabado(), hora: v('hora') || '19:00', local: v('local') || 'Local da festa', endereco: v('endereco') || 'Endereço da festa',
    recado: v('recado'), personalizacao: pers, modelo_dados: modelo, foto_url: fotoSrc, ajuste,
  };
}
function iniciaisAuto() { const a = $('nome1').value.trim(), b = $('nome2').value.trim(); return a && b ? `${a[0].toUpperCase()}&${b[0].toUpperCase()}` : ''; }
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
if (especial?.modelo || existente) { $('modelo').disabled = true; $('trocarModelo').disabled = true; }
$('modeloCapa').src = modelo.poster;

// ---------- galeria de aberturas (no lugar da lista do celular) ----------
const nomeCat = id => dados.categorias.find(c => c.id === id)?.nome || '';
function mostrarModeloAtual() { $('modeloNome').textContent = modelo.nome; $('modeloCat').textContent = nomeCat(modelo.categoria); $('modeloCapa').alt = modelo.nome; }
let catGaleria = null;
function pintarGaleria() {
  const cats = dados.categorias.filter(c => dados.modelos.some(m => m.categoria === c.id));
  $('galCats').replaceChildren(...[{ id: null, nome: 'Todas' }, ...cats].map(c => {
    const b = document.createElement('button'); b.type = 'button'; b.role = 'tab'; b.textContent = c.nome;
    b.setAttribute('aria-selected', String(catGaleria === c.id)); b.onclick = () => { catGaleria = c.id; pintarGaleria(); }; return b;
  }));
  const lista = dados.modelos.filter(m => !catGaleria || m.categoria === catGaleria);
  $('galGrade').replaceChildren(...lista.map(m => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'gal-item'; b.setAttribute('aria-pressed', String(m.id === modelo.id));
    const capa = document.createElement('span'); capa.className = 'capa';
    const im = document.createElement('img'); im.src = m.poster; im.alt = ''; im.loading = 'lazy'; capa.append(im);
    const nm = document.createElement('span'); nm.className = 'nome'; nm.textContent = m.nome;
    const pr = document.createElement('span'); pr.className = 'preco'; pr.textContent = catGaleria ? '' : nomeCat(m.categoria);
    b.append(capa, nm, pr);
    b.onclick = () => { $('modelo').value = m.id; $('modelo').dispatchEvent(new Event('change')); $('galeria').close(); };
    return b;
  }));
}
$('trocarModelo').onclick = () => { catGaleria = modelo.categoria; pintarGaleria(); $('galeria').showModal(); $('galGrade').scrollTop = 0; };
$('galFechar').onclick = () => $('galeria').close();
$('galeria').addEventListener('click', e => { if (e.target === $('galeria')) $('galeria').close(); });
mostrarModeloAtual();
function aplicarModo() {
  const cas = ehCasamento(modelo);
  if (cas !== (pers.estilo || '').startsWith('cas-')) { pers.estilo = cas ? 'cas-bordo' : 'classico'; pers.cores = { destaque: '', fundo: '' }; pers.fonte = ''; }
  document.body.classList.toggle('modo-casamento', cas);
  $('tit2').textContent = cas ? 'O casal e a cerimônia' : 'A festa';
  $('rotHora').textContent = cas ? 'Horário da cerimônia' : 'Horário';
  $('rotLocal').textContent = cas ? 'Local da cerimônia' : 'Nome do local';
  $('rotEndereco').textContent = cas ? 'Endereço da cerimônia' : 'Endereço';
  $('rotRecado').textContent = cas ? 'Texto do convite' : 'Mensagem de abertura';
  $('recado').placeholder = cas ? 'Ex.: Com a bênção de Deus e de nossas famílias, convidamos você para celebrar o nosso casamento.' : 'Ex.: Venha celebrar comigo esse dia tão especial!';
  $('homenageado').required = !cas;
  pintarEstilos();
  if (!existente) $('total').textContent = reais(total());
}
$('modelo').onchange = e => {
  const novo = dados.modelos.find(m => m.id === e.target.value);
  if (ehCasamento(novo) !== ehCasamento(modelo)) { pers.estilo = personalizacaoPadrao(novo.categoria).estilo; pers.cores = { destaque: '', fundo: '' }; pers.fonte = ''; }
  // se o cliente ainda não mexeu no estilo, acompanha a categoria do vídeo
  if (pers.estilo === personalizacaoPadrao(modelo.categoria).estilo) { pers.estilo = personalizacaoPadrao(novo.categoria).estilo; pers.cores = { destaque: '', fundo: '' }; pintarEstilos(); }
  modelo = novo; $('modeloCapa').src = modelo.poster; mostrarModeloAtual(); aplicarModo(); pintarEnquadro(); atualizar('video');
};
if (existente) { $('btFoto').hidden = true; $('fotoInfo').textContent = 'A foto não pode ser trocada depois do pedido, mas você pode ajustar o enquadramento.'; $('ajustes').hidden = false; }
else if (fotoSrc) { $('ajustes').hidden = false; $('fotoInfo').textContent = 'Usando a foto que você testou na página inicial.'; }
$('zoom').value = ajuste.zoom;
$('foto').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  if (!f.type.startsWith('image/')) return mostrarErro('Escolha um arquivo de imagem (JPG ou PNG).');
  const entrada = URL.createObjectURL(f);
  $('fotoInfo').textContent = 'Preparando foto…';
  try {
    const im = new Image(); im.src = entrada; await im.decode();
    const s = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    const nova = await new Promise(ok => c.toBlob(ok, 'image/jpeg', .88));
    if (!nova) throw new Error('foto');
    if (fotoSrc?.startsWith('blob:')) URL.revokeObjectURL(fotoSrc);
    arquivoFoto = nova; fotoSrc = URL.createObjectURL(nova);
    $('erro').hidden = true;
    $('ajustes').hidden = false; ajuste = { zoom: 1, x: .5, y: .5 }; $('zoom').value = 1; prepararEnquadro();
    $('fotoInfo').textContent = 'Foto pronta para a prévia. Ela será enviada ao clicar em “Ver convite pronto”.';
    atualizar('foto');
  } catch {
    $('fotoInfo').textContent = arquivoFoto ? 'A foto anterior foi mantida.' : 'A foto não foi carregada.';
    mostrarErro('Não foi possível abrir essa foto. Tente uma imagem JPG, PNG ou WebP.');
  } finally { URL.revokeObjectURL(entrada); e.target.value = ''; }
};
// ---------- enquadramento: arrastar e pinçar a foto dentro da moldura ----------
// Mesma conta do compositor: foto em "cover" na moldura, vezes o zoom; x/y = posição de 0 a 1.
const enq = $('enquadro'); let fotoDim = null, fimMexer = 0;
function molduraDoModelo() {
  const q = modelo?.quadros?.[modelo.quadros.length - 1] || [0, 0, .6, .45];
  return { prop: Math.max(.3, Math.min(3, (q[2] * 720) / (q[3] * 1280))), forma: modelo?.forma, mascara: modelo?.mascara };
}
// a máscara do modelo é preto e branco; o CSS precisa dela em transparência
const alfas = {};
function mascaraAlfa(src) {
  if (alfas[src] !== undefined) return alfas[src];
  alfas[src] = '';
  const im = new Image(); im.crossOrigin = 'anonymous';
  im.onload = () => { try {
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height); for (let i = 0; i < d.data.length; i += 4) { d.data[i + 3] = d.data[i]; d.data[i] = d.data[i + 1] = d.data[i + 2] = 0; }
    g.putImageData(d, 0, 0); alfas[src] = c.toDataURL('image/png'); pintarEnquadro();
  } catch {} };
  im.src = src; return '';
}
async function prepararEnquadro() {
  if (!fotoSrc) return;
  const im = new Image(); im.src = fotoSrc; try { await im.decode(); } catch { return; }
  fotoDim = [im.naturalWidth, im.naturalHeight]; enq.style.backgroundImage = `url("${fotoSrc}")`; pintarEnquadro();
}
function pintarEnquadro() {
  if (!fotoDim) return;
  const m = molduraDoModelo();
  enq.style.aspectRatio = String(m.prop);
  enq.classList.toggle('circulo', m.forma === 'circulo');
  const mk = m.forma === 'mascara' && m.mascara ? mascaraAlfa(m.mascara) : '';
  enq.style.webkitMaskImage = enq.style.maskImage = mk ? `url("${mk}")` : ''; enq.style.webkitMaskSize = enq.style.maskSize = '100% 100%';
  const W = enq.clientWidth, H = enq.clientHeight; if (!W || !H) return;
  const esc = Math.max(W / fotoDim[0], H / fotoDim[1]) * ajuste.zoom, w = fotoDim[0] * esc, h = fotoDim[1] * esc;
  enq.style.backgroundSize = `${w}px ${h}px`;
  enq.style.backgroundPosition = `${(W - w) * ajuste.x}px ${(H - h) * ajuste.y}px`;
}
const limitar = v => Math.min(1, Math.max(0, v));
function mudarAjuste(novo) {
  Object.assign(ajuste, novo); ajuste.zoom = Math.min(3, Math.max(1, ajuste.zoom)); ajuste.x = limitar(ajuste.x); ajuste.y = limitar(ajuste.y);
  ajuste = { ...ajuste }; $('zoom').value = ajuste.zoom; pintarEnquadro(); atualizar();
  enq.classList.add('mexendo'); clearTimeout(fimMexer);
  fimMexer = setTimeout(() => { enq.classList.remove('mexendo'); iframe.contentWindow.irPara?.('foto'); }, 500);
}
const dedos = new Map(); let gesto = null;
function lerGesto() {
  const p = [...dedos.values()], W = enq.clientWidth, H = enq.clientHeight;
  const esc = Math.max(W / fotoDim[0], H / fotoDim[1]) * ajuste.zoom;
  const cx = p.reduce((s, q) => s + q.x, 0) / p.length, cy = p.reduce((s, q) => s + q.y, 0) / p.length;
  const dist = p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
  return { cx, cy, dist, zoom: ajuste.zoom, x: ajuste.x, y: ajuste.y, folgaX: fotoDim[0] * esc - W, folgaY: fotoDim[1] * esc - H };
}
enq.addEventListener('pointerdown', e => { if (!fotoDim) return; enq.setPointerCapture(e.pointerId); dedos.set(e.pointerId, { x: e.clientX, y: e.clientY }); gesto = lerGesto(); });
enq.addEventListener('pointermove', e => {
  if (!dedos.has(e.pointerId) || !gesto) return; e.preventDefault();
  dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const p = [...dedos.values()], cx = p.reduce((s, q) => s + q.x, 0) / p.length, cy = p.reduce((s, q) => s + q.y, 0) / p.length;
  const zoom = p.length > 1 && gesto.dist ? gesto.zoom * Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / gesto.dist : gesto.zoom;
  // arrastar para a direita mostra mais da esquerda da foto
  mudarAjuste({ zoom, x: gesto.folgaX > 0 ? gesto.x - (cx - gesto.cx) / gesto.folgaX : .5, y: gesto.folgaY > 0 ? gesto.y - (cy - gesto.cy) / gesto.folgaY : .5 });
});
const soltar = e => { dedos.delete(e.pointerId); gesto = dedos.size ? lerGesto() : null; };
enq.addEventListener('pointerup', soltar); enq.addEventListener('pointercancel', soltar);
enq.addEventListener('wheel', e => { if (!fotoDim) return; e.preventDefault(); mudarAjuste({ zoom: ajuste.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06) }); }, { passive: false });
$('zoom').oninput = () => mudarAjuste({ zoom: +$('zoom').value });
addEventListener('resize', pintarEnquadro);
prepararEnquadro();

// ---------- 2. festa ----------
['homenageado', 'idade', 'tituloConvite', 'data', 'hora', 'local', 'endereco', 'recado', 'nome1', 'nome2', 'iniciais', 'versiculo', 'encerramento'].forEach(id => $(id).addEventListener('input', atualizar));
['nome1', 'nome2'].forEach(id => $(id).addEventListener('input', () => { if (!$('iniciais').dataset.mexeu) $('iniciais').value = iniciaisAuto(); atualizar(); }));
$('iniciais').addEventListener('input', () => $('iniciais').dataset.mexeu = '1');
if (existente) {
  const set = (id, v) => $(id).value = v || '';
  set('homenageado', existente.homenageado); set('idade', existente.idade); set('tituloConvite', existente.titulo); set('data', existente.data);
  set('hora', existente.hora); set('local', existente.local); set('endereco', existente.endereco); set('recado', existente.recado);
  const k = existente.personalizacao?.casal || {}; set('nome1', k.nome1); set('nome2', k.nome2); set('iniciais', k.iniciais); if (k.iniciais) $('iniciais').dataset.mexeu = '1';
  set('versiculo', existente.personalizacao?.blocos?.convite?.versiculo); set('encerramento', existente.personalizacao?.encerramento);
  if (ehCasamento(modelo) && existente.personalizacao?.blocos?.convite?.texto) set('recado', existente.personalizacao.blocos.convite.texto);
}

// ---------- 3. estilo ----------
carregarFontes(Object.values(FONTES).map(f => f.google));
function pintarEstilos() {
  const box = $('estilos'); box.textContent = '';
  let grupoAtual;
  const cas = ehCasamento(modelo);
  ESTILOS.filter(e => (e.grupo === 'casamento') === cas).forEach(e => {
    const g = e.grupo || 'tema';
    if (g !== grupoAtual) { grupoAtual = g; const t = document.createElement('p'); t.className = 'grupo-estilos'; t.textContent = g === 'min' ? 'Minimalistas' : g === 'casamento' ? 'Casamento' : 'Temáticos'; box.append(t); }
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
  pintarFontes();
}
$('fonte').append(new Option('Padrão do estilo', ''), ...Object.entries(FONTES).map(([k, f]) => new Option(f.nome, k)));
function pintarFontes() {
  const base = FONTES[estiloPorId(pers.estilo).titulo];
  const atual = FONTES[pers.fonte] || base;
  $('fonteAtual').textContent = pers.fonte ? atual.nome : 'Padrão do estilo';
  $('fonteAtual').style.fontFamily = atual.css;
  const box = $('fontesOpcoes'); box.textContent = '';
  const exemplo = ehCasamento(modelo) ? ([$('nome1').value.trim(), $('nome2').value.trim()].filter(Boolean).join(' & ') || 'Laura & Rafael') : ($('homenageado').value.trim() || 'Seu convite');
  for (const [chave, fonte] of [['', { ...base, nome: 'Padrão do estilo' }], ...Object.entries(FONTES)]) {
    const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'fonte-opcao';
    bt.setAttribute('aria-pressed', String(chave === pers.fonte));
    const nome = document.createElement('small'); nome.textContent = fonte.nome;
    const amostra = document.createElement('span'); amostra.textContent = exemplo; amostra.style.fontFamily = fonte.css;
    bt.append(nome, amostra);
    bt.onclick = () => { pers.fonte = chave; $('fonte').value = chave; pintarFontes(); atualizar('convite'); $('fontesMenu').open = false; $('fontesMenu').querySelector('summary').focus(); };
    box.append(bt);
  }
}
$('fontesMenu').addEventListener('toggle', () => { if ($('fontesMenu').open) pintarFontes(); });

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
function pintarEvitar() {
  const box = $('trajeEvitar'); box.textContent = ''; const lista = pers.blocos.traje.evitar ||= [];
  lista.forEach((c, i) => {
    const inp = Object.assign(document.createElement('input'), { type: 'color', value: c, ariaLabel: `Cor para evitar ${i + 1}` });
    inp.oninput = () => { lista[i] = inp.value; atualizar(); };
    const x = Object.assign(document.createElement('button'), { type: 'button', className: 'mini-bt', textContent: 'remover' });
    x.onclick = () => { lista.splice(i, 1); pintarEvitar(); atualizar(); };
    const w = document.createElement('span'); w.style.cssText = 'display:grid;justify-items:center'; w.append(inp, x); box.append(w);
  });
  if (lista.length < 4) { const add = Object.assign(document.createElement('button'), { type: 'button', className: 'mini-bt', textContent: '+ Cor para evitar' }); add.onclick = () => { lista.push('#ffffff'); pintarEvitar(); atualizar(); }; box.append(add); }
}
pintarTraje(); pintarEvitar();
const ligar = (id, get, set) => { $(id).value = get() ?? ''; $(id).addEventListener('input', () => { set($(id).value); atualizar(); }); };
ligar('trajeTexto', () => pers.blocos.traje.texto, v => pers.blocos.traje.texto = v);
ligar('presItens', () => pers.blocos.presentes.itens.join('\n'), v => pers.blocos.presentes.itens = v.split('\n').map(s => s.trim()).filter(Boolean));
ligar('presPix', () => pers.blocos.presentes.pix, v => pers.blocos.presentes.pix = v);
ligar('presTam', () => pers.blocos.presentes.tamanhos, v => pers.blocos.presentes.tamanhos = v);
ligar('rsvpLimite', () => pers.blocos.rsvp.limite, v => pers.blocos.rsvp.limite = Math.min(30, Math.max(1, parseInt(v, 10) || 1)));
ligar('rsvpPrazo', () => pers.blocos.rsvp.prazo, v => pers.blocos.rsvp.prazo = v);
ligar('obsTexto', () => pers.blocos.observacoes.texto, v => pers.blocos.observacoes.texto = v);
ligar('recLocal', () => pers.blocos.recepcao.local, v => pers.blocos.recepcao.local = v);
ligar('recEnd', () => pers.blocos.recepcao.endereco, v => pers.blocos.recepcao.endereco = v);
ligar('recHora', () => pers.blocos.recepcao.hora, v => pers.blocos.recepcao.hora = v);
ligar('histTexto', () => pers.blocos.historia.texto, v => pers.blocos.historia.texto = v);
ligar('presTexto', () => pers.blocos.presentes.texto, v => pers.blocos.presentes.texto = v);
ligar('presLink', () => pers.blocos.presentes.link, v => pers.blocos.presentes.link = v.trim());
ligar('presBanco', () => pers.blocos.presentes.banco, v => pers.blocos.presentes.banco = v);
$('rsvpRestr').checked = !!pers.blocos.rsvp.restricoes;
$('rsvpRestr').onchange = e => { pers.blocos.rsvp.restricoes = e.target.checked; atualizar(); };
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
const total = () => especial ? especial.valor_centavos : (ehCasamento(modelo) ? CONFIG.precoCasamento : CONFIG.precoConvite) + (document.querySelector('[name=musica]:checked').value === 'personalizada' ? CONFIG.precoMusica : 0);
if (!existente) { document.querySelectorAll('[name=musica]').forEach(r => r.onchange = () => $('total').textContent = reais(total())); $('total').textContent = reais(total()); }
aplicarModo();

function mostrarErro(t, rolar = true) { $('erro').textContent = t; $('erro').hidden = false; if (rolar) $('erro').scrollIntoView({ block: 'center', behavior: 'smooth' }); }

// ---------- enviar ----------
$('form').onsubmit = async e => {
  e.preventDefault(); $('erro').hidden = true;
  const visiveis = [...$('form').querySelectorAll('[required]')].filter(i => !i.closest('[hidden]') && i.offsetParent !== null);
  const cas = ehCasamento(modelo);
  if (cas && (!$('nome1').value.trim() || !$('nome2').value.trim())) { (!$('nome1').value.trim() ? $('nome1') : $('nome2')).focus(); return mostrarErro('Preencha os nomes do casal.'); }
  dadosPrevia(); // garante casal e texto do convite atualizados em pers
  const falta = visiveis.find(i => !i.value.trim());
  if (falta) { falta.focus(); return mostrarErro(`Preencha o campo "${$('form').querySelector(`label[for=${falta.id}]`).textContent}".`); }
  const bt = $('enviar'); bt.disabled = true;

  if (existente) {
    const corpo = { slug: existente.slug, homenageado: cas ? `${$('nome1').value.trim()} & ${$('nome2').value.trim()}` : $('homenageado').value, idade: $('idade').value, titulo: $('tituloConvite').value, data: $('data').value, hora: $('hora').value,
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

  if (!arquivoFoto && !cas) { bt.disabled = false; return mostrarErro('Escolha a foto que vai aparecer na moldura.'); }
  if ($('whatsapp').value.replace(/\D/g, '').length < 10) { bt.disabled = false; $('whatsapp').focus(); return mostrarErro('Confira o número de WhatsApp com DDD.'); }
  if (!$('email').checkValidity()) { bt.disabled = false; $('email').focus(); return mostrarErro('Confira o e-mail. É nele que o link do convite chega.'); }
  const fd = new FormData();
  ['homenageado', 'idade', 'data', 'hora', 'local', 'endereco', 'recado', 'cliente', 'whatsapp', 'email'].forEach(id => fd.set(id, $(id).value));
  fd.set('titulo', cas ? '' : $('tituloConvite').value);
  if (cas) fd.set('homenageado', `${$('nome1').value.trim()} & ${$('nome2').value.trim()}`);
  fd.set('musica', document.querySelector('[name=musica]:checked').value);
  fd.set('modelo', modelo.id); fd.set('ajuste', JSON.stringify(ajuste)); fd.set('personalizacao', JSON.stringify(pers));
  if (arquivoFoto && !cas) fd.set('foto', arquivoFoto, 'foto.jpg');
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
conectarPrevia();
atualizar();
