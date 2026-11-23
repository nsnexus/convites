import { Compositor, carregarModelos, fotoExemplo } from './compositor.js';
import { zap } from './config.js';

const dados = await carregarModelos();
const porId = Object.fromEntries(dados.modelos.map(m => [m.id, m]));
const nomeCat = Object.fromEntries(dados.categorias.map(c => [c.id, c.nome]));

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

// ---------- vitrine ----------
const abas = document.getElementById('abas'), vitrine = document.getElementById('vitrine');
let catAtual = dados.categorias[0].id;
dados.categorias.forEach(c => {
  const b = document.createElement('button'); b.role = 'tab'; b.textContent = c.nome;
  b.setAttribute('aria-selected', c.id === catAtual);
  b.onclick = () => { catAtual = c.id; abas.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x === b)); render(); };
  abas.append(b);
});
function render() {
  vitrine.innerHTML = '';
  dados.modelos.filter(m => m.categoria === catAtual).forEach(m => {
    const b = document.createElement('button'); b.className = 'card-modelo';
    b.innerHTML = `<div class="capa"><img src="${m.poster}" alt="" loading="lazy"><span class="play" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="#26122E"><path d="M7 4v16l13-8z"/></svg></span></div><h3>${m.nome}</h3><span>${nomeCat[m.categoria]}</span>`;
    b.onclick = () => abrir(m);
    vitrine.append(b);
  });
  const ex = document.createElement('a'); ex.className = 'card-modelo card-exclusivo'; ex.href = zap('Olá! Quero um modelo de convite exclusivo.'); ex.target = '_blank'; ex.rel = 'noopener';
  ex.innerHTML = `<div class="capa"><p>Não achou o tema? Criamos um só seu.</p></div><h3>Modelo exclusivo</h3><span>Sob orçamento</span>`;
  vitrine.append(ex);
}
render();

// ---------- modal ----------
const modal = document.getElementById('modal'), mv = document.getElementById('modalVid');
let comp;
function abrir(m) {
  document.getElementById('modalNome').textContent = m.nome;
  document.getElementById('modalCat').textContent = nomeCat[m.categoria];
  document.getElementById('modalUsar').href = `/criar?modelo=${m.id}`;
  modal.showModal(); hero && hv.pause();
  if (!comp) { comp = new Compositor(document.getElementById('modalCanvas'), mv, m); comp.definirFoto(foto); mv.src = m.video; }
  else { comp.definirFoto(foto); comp.trocarModelo(m); }
  mv.muted = false; mv.loop = true;
  mv.play().catch(() => { mv.muted = true; mv.play(); });
}
document.getElementById('modalCanvas').onclick = () => { mv.muted = !mv.muted; if (mv.paused) mv.play(); };
modal.addEventListener('close', () => { mv.pause(); hero && hv.play().catch(() => {}); });
document.getElementById('fechar').onclick = () => modal.close();
modal.addEventListener('click', e => { if (e.target.classList.contains('modal-in')) modal.close(); });

document.getElementById('btExclusivo').href = zap('Olá! Quero um modelo de convite exclusivo.');
document.getElementById('linkZap').href = zap('Olá! Tenho uma dúvida sobre os convites.');
