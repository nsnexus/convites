import { Compositor, carregarModelos, fotoExemplo } from './compositor.js?v=31afcda2';
import { ligarSuporte, ligarPrecos, carregarConfig } from './config.js?v=12104be8';

const [dados] = await Promise.all([carregarModelos(), carregarConfig()]);
const porId = Object.fromEntries(dados.modelos.map(m => [m.id, m]));

// Foto: a do visitante (se ele testou) ou a de exemplo
let foto = fotoExemplo();
const salva = sessionStorage.getItem('fotoTeste');
if (salva) foto = await carregarImg(salva);

function carregarImg(src) { return new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = src; }); }

// ---------- prévia do topo ----------
const destaque = ['c9803844', 'db978e7e', 'cbb6b11a', '77916764'].map(id => porId[id]).filter(Boolean);
if (!destaque.length) destaque.push(...dados.modelos.slice(0, 4));
const hv = document.getElementById('heroVid');
let hi = 0, hero;
try {
  hero = new Compositor(document.getElementById('heroCanvas'), hv, destaque[0]);
  hero.definirFoto(foto);
  hv.src = destaque[0].video; hv.play().catch(() => {});
  hv.addEventListener('ended', () => { hi = (hi + 1) % destaque.length; ativarHero(); });
} catch { document.getElementById('heroCanvas').replaceWith(Object.assign(document.createElement('img'), { src: destaque[0].poster, alt: '' })); }

function ativarHero() {
  hero.trocarModelo(destaque[hi]); hv.play().catch(() => {});
  troca.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', i === hi));
}
const troca = document.getElementById('heroTroca');
destaque.forEach((m, i) => {
  const b = document.createElement('button');
  b.setAttribute('aria-pressed', i === 0); b.setAttribute('aria-label', `Ver modelo ${m.nome}`);
  b.innerHTML = `<img src="${m.poster}" alt="">`;
  b.onclick = () => { hi = i; ativarHero(); };
  troca.append(b);
});

document.getElementById('fotoTeste').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  const url = URL.createObjectURL(f); const im = await carregarImg(url);
  // reduz e guarda para reaproveitar na página de criação
  const s = Math.min(1, 1000 / Math.max(im.width, im.height)), c = document.createElement('canvas');
  c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  try { sessionStorage.setItem('fotoTeste', c.toDataURL('image/jpeg', .85)); } catch {}
  foto = c; hero?.definirFoto(c);
  // pula para o momento em que a foto aparece
  hv.currentTime = Math.max(0, destaque[hi].inicio / 24 - .3); hv.play().catch(() => {});
});


ligarSuporte(); ligarPrecos();

const trilho = document.getElementById('galeriaModelos');
const filtros = document.getElementById('filtrosModelos');
const anterior = document.getElementById('modelosAntes'), proximo = document.getElementById('modelosDepois');
const categorias = Object.fromEntries(dados.categorias.map(c => [c.id, c.nome]));
let categoria = '', tocando = null;
function pararPrevia() {
  if (!tocando) return;
  tocando.video.pause(); tocando.video.hidden = true;
  tocando.botao.textContent = 'Ver abertura';
  tocando.botao.setAttribute('aria-pressed', 'false');
  tocando = null;
}
function setas() {
  anterior.disabled = trilho.scrollLeft < 2;
  proximo.disabled = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 2;
}
function pintarGaleria() {
  pararPrevia(); trilho.replaceChildren();
  const modelos = dados.modelos.filter(m => !categoria || m.categoria === categoria);
  document.getElementById('modelosResumo').textContent = modelos.length + (modelos.length === 1 ? ' modelo' : ' modelos');
  modelos.forEach(m => {
    const card = document.createElement('article'); card.className = 'galeria-card';
    const media = document.createElement('div'); media.className = 'galeria-media';
    const img = Object.assign(document.createElement('img'), { src: m.poster, alt: m.nome, loading: 'lazy', decoding: 'async' });
    const video = Object.assign(document.createElement('video'), { muted: true, playsInline: true, preload: 'none', hidden: true });
    const play = document.createElement('button'); play.type = 'button'; play.className = 'galeria-play'; play.textContent = 'Ver abertura';
    play.setAttribute('aria-label', 'Ver abertura: ' + m.nome); play.setAttribute('aria-pressed', 'false');
    play.onclick = async () => {
      if (tocando?.video === video) { pararPrevia(); return; }
      pararPrevia(); hero && hv.pause();
      tocando = { video, botao: play };
      video.src ||= m.video; video.hidden = false;
      play.textContent = 'Parar prévia'; play.setAttribute('aria-pressed', 'true');
      try { await video.play(); } catch { if (tocando?.video === video) pararPrevia(); }
    };
    video.onended = () => { if (tocando?.video === video) pararPrevia(); };
    media.append(img, video, play);
    const texto = document.createElement('div'); texto.className = 'galeria-texto';
    const nome = document.createElement('h3'); nome.textContent = m.nome;
    const cat = document.createElement('p'); cat.textContent = categorias[m.categoria] || 'Convite personalizado';
    const usar = document.createElement('a'); usar.href = '/criar?modelo=' + encodeURIComponent(m.id); usar.textContent = 'Usar este modelo';
    texto.append(nome, cat, usar); card.append(media, texto); trilho.append(card);
  });
  trilho.scrollLeft = 0;
  requestAnimationFrame(setas);
}
[{ id: '', nome: 'Todos' }, ...dados.categorias.filter(c => dados.modelos.some(m => m.categoria === c.id))].forEach(c => {
  const bt = document.createElement('button'); bt.type = 'button'; bt.textContent = c.nome;
  bt.setAttribute('aria-pressed', String(c.id === categoria));
  bt.onclick = () => {
    categoria = c.id;
    filtros.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === bt)));
    pintarGaleria();
  };
  filtros.append(bt);
});
const mover = sinal => trilho.scrollBy({ left: sinal * Math.max(160, trilho.clientWidth * .8), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
anterior.onclick = () => mover(-1); proximo.onclick = () => mover(1);
trilho.addEventListener('scroll', setas, { passive: true });
window.addEventListener('resize', setas);
pintarGaleria();
