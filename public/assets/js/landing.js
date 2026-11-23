import { Compositor, carregarModelos, fotoExemplo } from './compositor.js';
import { ligarSuporte, ligarPrecos, carregarConfig } from './config.js';

const [dados] = await Promise.all([carregarModelos(), carregarConfig()]);
const porId = Object.fromEntries(dados.modelos.map(m => [m.id, m]));

// Foto: a do visitante (se ele testou) ou a de exemplo
let foto = fotoExemplo();
const salva = sessionStorage.getItem('fotoTeste');
if (salva) foto = await carregarImg(salva);

function carregarImg(src) { return new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = src; }); }

// ---------- prévia do topo ----------
const destaque = ['c9803844', 'db978e7e', 'cbb6b11a', '77916764'].map(id => porId[id]);
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
