import { Compositor, carregarModelos, fotoExemplo } from './compositor.js?v=528ded9f';
import { renderizarConvite, tituloDe } from './convite-render.js?v=74648e59';
import { renderizarCasamento, iniciaisCasal, nomesCasal } from './casamento-render.js?v=0f873d99';
import { ehCasamento } from './estilos.js?v=d5c0644b';
import { CONFIG, reais } from './config.js?v=12104be8';

const $ = id => document.getElementById(id);
const embed = new URLSearchParams(location.search).has('embed');
const slug = location.pathname.split('/').filter(Boolean).pop();

// Convite de exemplo (/c/exemplo), sem banco
const EXEMPLO = {
  slug: 'exemplo', modelo: 'c9803844', homenageado: 'Laura', idade: '15', titulo: 'Os 15 anos da Laura',
  data: '2026-12-12', hora: '20:00', local: 'Espaço Jardim das Flores', endereco: 'Rua das Acácias, 120, Centro',
  recado: 'Venha celebrar comigo uma noite que eu sonhei a vida inteira.', foto_url: null, ajuste: { zoom: 1, x: .5, y: .5 },
  personalizacao: { estilo: 'princesa', blocos: {
    programacao: { ativo: true, itens: [{ hora: '20:00', texto: 'Recepção' }, { hora: '21:30', texto: 'Valsa' }, { hora: '22:00', texto: 'Jantar e pista' }] },
    traje: { ativo: true, texto: 'Esporte fino. Evite branco.', cores: ['#e0628f', '#f4c2d7', '#c9b8f2'] },
    presentes: { ativo: true, itens: ['Perfume', 'Bolsa', 'Vale-presente'], pix: 'laura15@exemplo.com', tamanhos: 'Roupa M, calçado 36' },
    rsvp: { ativo: true, criancas: true, limite: 4, prazo: '2026-12-05' } } },
};

let comp, modeloAtual, fotoAtual;
const vd = $('vd');
let mostrandoAbertura = true;
function mostrarAbertura() {
  mostrandoAbertura = true;
  document.body.classList.add('abertura');
  $('abertura').hidden = false;
  $('convite').hidden = true;
  scrollTo({ top: 0, behavior: 'instant' });
}
function mostrarConvite() {
  mostrandoAbertura = false;
  vd.pause();
  $('abertura').hidden = true;
  $('convite').hidden = false;
  document.body.classList.remove('abertura');
  scrollTo({ top: 0, behavior: 'instant' });
}
vd.loop = false;
vd.addEventListener('ended', mostrarConvite);
mostrarAbertura();

// iniciais: para vídeos de selo (casamento), vai no selo no lugar da foto
async function montarVideo(modelo, foto, ajuste, iniciais) {
  if (!comp) { comp = new Compositor($('cv'), vd, modelo); vd.src = modelo.video; }
  else if (modeloAtual?.id !== modelo.id) comp.trocarModelo(modelo);
  modeloAtual = modelo;
  $('fundo').style.backgroundImage = `url(${modelo.poster})`;
  if (modelo.tipo === 'selo') { const chave = 'selo:' + iniciais; if (chave !== fotoAtual) { fotoAtual = chave; await comp.definirIniciais(iniciais); } return; }
  if (foto !== fotoAtual) { fotoAtual = foto; if (foto) await comp.definirFoto(foto); else comp.definirFoto(fotoExemplo()); }
  if (ajuste) comp.definirAjuste(ajuste);
}
const renderizar = (modelo, ...args) => (ehCasamento(modelo) ? renderizarCasamento : renderizarConvite)(...args);

if (embed) {
  // Prévia dentro do editor: o /criar chama window.atualizarPrevia(dados)
  document.body.classList.add('embed');
  $('estado').remove(); $('app').hidden = false; $('abrir').remove();
  vd.muted = true;
  let modoPrevia = 'video';
  $('som').remove();
  window.atualizarPrevia = async (c) => {
    const mudouModelo = modeloAtual?.id !== c.modelo_dados.id;
    await montarVideo(c.modelo_dados, c.foto_url, c.ajuste, iniciaisCasal(c));
    renderizar(c.modelo_dados, $('convite'), c, { modo: 'editor' });
    if (mudouModelo) { modoPrevia = 'video'; mostrarAbertura(); vd.currentTime = 0; }
    if (mostrandoAbertura && modoPrevia === 'video' && vd.paused && !vd.ended) vd.play().catch(() => {});
  };
  window.irPara = (onde) => {
    modoPrevia = onde;
    if (onde === 'convite') return mostrarConvite();
    if (!modeloAtual) return;
    mostrarAbertura();
    if (onde === 'foto') {
      const tempo = modeloAtual.tipo === 'selo' ? 0 : modeloAtual.inicio / modeloAtual.fps + 1.4;
      vd.pause();
      vd.currentTime = Number.isFinite(vd.duration) ? Math.min(vd.duration - .05, tempo) : tempo;
    } else {
      vd.currentTime = 0;
      vd.play().catch(() => {});
    }
  };
  window.parent.postMessage({ tipo: 'previa-pronta' }, location.origin);
} else {
  let c;
  try {
    if (slug === 'exemplo') c = EXEMPLO;
    else {
      const r = await fetch(`/api/convites/${encodeURIComponent(slug)}`);
      if (!r.ok) throw new Error(r.status === 404 ? 'Convite não encontrado. Confira o link que você recebeu.' : 'Não foi possível abrir o convite agora. Tente de novo em instantes.');
      c = await r.json();
    }
  } catch (e) { $('estado').textContent = e.message; throw e; }

  let modelo = c.modelo_dados;
  if (!modelo) { const { modelos } = await carregarModelos(); modelo = modelos.find(m => m.id === c.modelo) || modelos[0]; }
  const casamento = ehCasamento(modelo);
  document.title = casamento ? `Casamento ${nomesCasal(c).join(' & ')}` : `${tituloDe(c)} | Convite`;
  await montarVideo(modelo, c.foto_url, c.ajuste, iniciaisCasal(c));
  vd.addEventListener('loadeddata', () => comp.desenhar(), { once: true });
  renderizar(modelo, $('convite'), c, {
    modo: c.previa ? 'previa' : 'real',
    aoConfirmar: async corpo => {
      if (c.slug === 'exemplo') return;
      const r = await fetch('/api/rsvp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro || 'A resposta não foi enviada. Verifique a internet e tente de novo.');
    },
  });
  if (c.previa) faixaPrevia(c);
  $('estado').remove(); $('app').hidden = false;

  let musica;
  if (c.musica_url) { musica = new Audio(c.musica_url); musica.loop = true; }
  if (casamento) {
    // abertura do casamento: o vídeo fica parado no envelope até a pessoa tocar no selo
    $('abrir').querySelector('span').lastChild.textContent = 'Toque no selo para abrir';
    $('abrir').style.background = 'transparent';
    vd.addEventListener('loadeddata', () => { vd.currentTime = .01; }, { once: true });

  }
  $('abrir').onclick = () => {
    $('abrir').remove(); $('som').hidden = false;
    vd.muted = false; vd.play().catch(() => { vd.muted = true; vd.play(); });
  };
  vd.addEventListener('ended', () => { if (musica && !vd.muted) musica.play().catch(() => {}); });
  $('som').onclick = () => { const mudo = !vd.muted; vd.muted = mudo; if (musica) musica.muted = mudo; $('ondas').style.display = mudo ? 'none' : ''; };
}

// Faixa da prévia: aparece enquanto o convite não foi pago
function faixaPrevia(c) {
  const meus = JSON.parse(localStorage.getItem('nsPedidos') || '{}');
  const meu = meus[c.slug];
  const f = $('faixa'); f.className = 'cv-faixa-previa';
  const txt = document.createElement('span');
  txt.innerHTML = '<b>Prévia do convite.</b> ';
  txt.append(meu || c.id ? 'Libere para compartilhar e receber confirmações.' : 'Este convite ainda não foi liberado.');
  f.append(txt);
  const bts = document.createElement('span'); bts.style.cssText = 'display:flex;gap:8px';
  if (meu) { const ed = document.createElement('a'); ed.className = 'sec'; ed.href = `/criar?editar=${c.slug}`; ed.textContent = 'Editar'; bts.append(ed); }
  if (meu && c.id) {
    const lib = document.createElement('a'); lib.textContent = `Liberar convite · ${reais(c.valor_centavos)}`;
    lib.href = CONFIG.checkoutUrl ? CONFIG.checkoutUrl + encodeURIComponent(c.id) : `/obrigado?pedido=${c.id}`;
    bts.append(lib);
  }
  f.append(bts);
}
