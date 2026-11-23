import { Compositor, carregarModelos, fotoExemplo } from './compositor.js';

const $ = id => document.getElementById(id);
const slug = location.pathname.split('/').filter(Boolean).pop();

// Convite de exemplo (/c/exemplo) para demonstrar sem banco de dados
const EXEMPLO = {
  slug: 'exemplo', modelo: 'c9803844', homenageado: 'Laura', idade: '15', titulo: 'Os 15 anos da Laura',
  data: '2026-12-12', hora: '20:00', local: 'Espaço Jardim das Flores', endereco: 'Rua das Acácias, 120, Centro',
  recado: 'Venha celebrar comigo uma noite que eu sonhei a vida inteira.', presentes: ['Perfume', 'Bolsa', 'Vale-presente'],
  foto_url: null, ajuste: { zoom: 1, x: .5, y: .5 }, musica_url: null,
};

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

// textos
const titulo = c.titulo || `${c.homenageado}${c.idade ? `, ${c.idade} anos` : ''}`;
document.title = `${titulo} | Convite`;
$('titulo').textContent = titulo;
$('recado').textContent = c.recado || '';
const dt = new Date(`${c.data}T${c.hora || '00:00'}:00`);
$('quando').textContent = dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, s => s.toUpperCase());
$('hora').textContent = c.hora ? `às ${c.hora.replace(':', 'h')}` : '';
$('local').textContent = c.local;
$('endereco').textContent = c.endereco;
$('mapa').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.local}, ${c.endereco}`)}`;
$('fundo').style.backgroundImage = `url(${modelo.poster})`;

// vídeo com foto
const vd = $('vd');
const comp = new Compositor($('cv'), vd, modelo);
vd.src = modelo.video;
if (c.foto_url) await comp.definirFoto(c.foto_url); else comp.definirFoto(fotoExemplo());
if (c.ajuste) comp.definirAjuste(c.ajuste);
vd.addEventListener('loadeddata', () => comp.desenhar(), { once: true });

$('estado').remove(); $('app').hidden = false;

let musica;
if (c.musica_url) { musica = new Audio(c.musica_url); musica.loop = true; }

$('abrir').onclick = () => {
  $('abrir').remove(); $('som').hidden = false;
  vd.muted = false; vd.play().catch(() => { vd.muted = true; vd.play(); });
};
vd.addEventListener('ended', () => {
  $('descer').classList.add('ver');
  if (musica && !vd.muted) musica.play().catch(() => {});
});
$('som').onclick = () => {
  const mudo = !vd.muted; vd.muted = mudo; if (musica) musica.muted = mudo;
  $('ondas').style.display = mudo ? 'none' : '';
};

// agenda (.ics)
$('agenda').onclick = () => {
  const p = n => String(n).padStart(2, '0');
  const f = d => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
  const fim = new Date(dt.getTime() + 4 * 3600e3);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NS Convites//PT', 'BEGIN:VEVENT', `UID:${c.slug}@nsconvites`,
    `DTSTART:${f(dt)}`, `DTEND:${f(fim)}`, `SUMMARY:${titulo}`, `LOCATION:${c.local} - ${c.endereco}`, `DESCRIPTION:${location.href}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'festa.ics'; a.click();
};

// presentes
if (c.presentes?.length) {
  $('blocoPresentes').hidden = false;
  c.presentes.forEach(p => {
    const l = document.createElement('label'); l.className = 'escolha';
    l.innerHTML = `<input type="radio" name="presente"><span></span>`; l.querySelector('span').textContent = p; l.querySelector('input').value = p;
    $('presentes').append(l);
  });
}

// confirmação de presença
document.querySelectorAll('[name=vai]').forEach(r => r.onchange = () => {
  const vai = r.value === 'sim' && r.checked; $('campoQtd').hidden = !vai; $('blocoPresentes').hidden = !vai || !c.presentes?.length;
});
$('presenca').onsubmit = async e => {
  e.preventDefault(); $('erro').hidden = true;
  const fd = new FormData(e.target);
  if (!fd.get('nome')?.trim()) { $('nome').focus(); return erro('Escreva seu nome.'); }
  if (!fd.get('vai')) return erro('Escolha se você vai ou não.');
  const corpo = { slug: c.slug, nome: fd.get('nome').trim(), vai: fd.get('vai') === 'sim', qtd: +fd.get('qtd') || 1, presente: fd.get('presente') || null, recado: fd.get('msg') || null };
  $('enviar').disabled = true;
  try {
    if (c.slug !== 'exemplo') {
      const r = await fetch('/api/rsvp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
      if (!r.ok) throw 0;
    }
    $('presenca').hidden = true; $('ok').hidden = false;
    $('okTxt').textContent = corpo.vai ? `Obrigado, ${corpo.nome}! Te esperamos lá.` : `Obrigado por avisar, ${corpo.nome}.`;
  } catch { erro('A resposta não foi enviada. Verifique a internet e tente de novo.'); $('enviar').disabled = false; }
};
function erro(t) { $('erro').textContent = t; $('erro').hidden = false; }
