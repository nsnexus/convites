import { Compositor, carregarModelos, fotoExemplo } from './compositor.js';
import { CONFIG, reais } from './config.js';

const $ = id => document.getElementById(id);
const dados = await carregarModelos();
const nomeCat = Object.fromEntries(dados.categorias.map(c => [c.id, c.nome]));
const qs = new URLSearchParams(location.search);

// Pedido especial: /criar?pedido=<token>
const tokenEspecial = qs.get('pedido');
let especial = null;
if (tokenEspecial) {
  const r = await fetch(`/api/especial/${encodeURIComponent(tokenEspecial)}`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { document.querySelector('main').innerHTML = `<div class="pronto"><h1 style="font-size:2.2rem">${j.erro || 'Link inválido.'}</h1><p>Fale com a gente pelo WhatsApp se precisar de ajuda.</p></div>`; throw 0; }
  especial = j;
  if (j.modelo && !dados.modelos.some(m => m.id === j.modelo.id)) dados.modelos.unshift(j.modelo);
}
let modelo = dados.modelos.find(m => m.id === (especial?.modelo?.id || qs.get('modelo'))) || dados.modelos[0];

// seletor de modelo agrupado por categoria
if (especial?.modelo) { $('modelo').append(new Option(especial.modelo.nome, especial.modelo.id, true, true)); $('modelo').disabled = true; }
else dados.categorias.forEach(c => {
  const g = document.createElement('optgroup'); g.label = c.nome;
  dados.modelos.filter(m => m.categoria === c.id).forEach(m => g.append(new Option(m.nome, m.id, false, m.id === modelo.id)));
  $('modelo').append(g);
});
$('modeloCapa').src = modelo.poster;

const vd = $('vd');
const comp = new Compositor($('cv'), vd, modelo);
vd.src = modelo.video; vd.loop = true; vd.play().catch(() => {});

let arquivoFoto = null;
const salva = sessionStorage.getItem('fotoTeste');
if (salva) {
  const im = new Image(); im.src = salva; await im.decode(); comp.definirFoto(im);
  arquivoFoto = await (await fetch(salva)).blob();
  $('ajustes').hidden = false; $('fotoInfo').textContent = 'Usando a foto que você testou na página inicial.';
} else comp.definirFoto(fotoExemplo());

const irParaFoto = () => { vd.currentTime = Math.min(9.5, modelo.inicio / modelo.fps + 1.6); vd.play().catch(() => {}); };
$('verFinal').onclick = irParaFoto;
$('verInicio').onclick = () => { vd.currentTime = 0; vd.play().catch(() => {}); };

$('modelo').onchange = e => {
  modelo = dados.modelos.find(m => m.id === e.target.value);
  $('modeloCapa').src = modelo.poster; comp.trocarModelo(modelo); vd.play().catch(() => {});
  history.replaceState(null, '', `?modelo=${modelo.id}`);
};

$('foto').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  if (!f.type.startsWith('image/')) return mostrarErro('Escolha um arquivo de imagem (JPG, PNG ou HEIC convertido).');
  const im = new Image(); im.src = URL.createObjectURL(f); await im.decode();
  // reduz para no máximo 1600px antes de enviar
  const s = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  arquivoFoto = await new Promise(ok => c.toBlob(ok, 'image/jpeg', .88));
  comp.definirFoto(c); $('ajustes').hidden = false; $('fotoInfo').textContent = 'Ajuste o enquadramento se precisar.';
  irParaFoto();
};
['zoom', 'px', 'py'].forEach(id => $(id).oninput = () => {
  comp.definirAjuste({ zoom: +$('zoom').value, x: +$('px').value, y: +$('py').value });
  if (vd.currentTime < modelo.inicio / modelo.fps + .5) irParaFoto();
});

// total
if (especial) {
  $('especialInfo').hidden = false; $('especialDesc').textContent = especial.descricao;
  $('blocoMusica').hidden = true;
  if (especial.cliente_nome) $('cliente').value = especial.cliente_nome;
  if (especial.cliente_whatsapp) $('whatsapp').value = especial.cliente_whatsapp;
  if (especial.cliente_email) $('email').value = especial.cliente_email;
}
const total = () => especial ? especial.valor_centavos : CONFIG.precoConvite + (document.querySelector('[name=musica]:checked').value === 'personalizada' ? CONFIG.precoMusica : 0);
document.querySelectorAll('[name=musica]').forEach(r => r.onchange = () => $('total').textContent = reais(total()));
$('total').textContent = reais(total());

function mostrarErro(t) { $('erro').textContent = t; $('erro').hidden = false; $('erro').scrollIntoView({ block: 'center', behavior: 'smooth' }); }

$('form').onsubmit = async e => {
  e.preventDefault(); $('erro').hidden = true;
  const f = e.target;
  const falta = [...f.querySelectorAll('[required]')].find(i => !i.value.trim());
  if (falta) { falta.focus(); return mostrarErro(`Preencha o campo "${f.querySelector(`label[for=${falta.id}]`).textContent}".`); }
  if (!arquivoFoto) return mostrarErro('Escolha a foto que vai aparecer na moldura.');
  if ($('whatsapp').value.replace(/\D/g, '').length < 10) { $('whatsapp').focus(); return mostrarErro('Confira o número de WhatsApp com DDD.'); }
  if (!$('email').checkValidity()) { $('email').focus(); return mostrarErro('Confira o e-mail. É nele que o link do convite chega.'); }

  const fd = new FormData(f);
  fd.set('modelo', modelo.id);
  if (tokenEspecial) fd.set('pedido', tokenEspecial);
  fd.set('ajuste', JSON.stringify(comp.ajuste));
  fd.set('foto', arquivoFoto, 'foto.jpg');
  $('enviar').disabled = true; $('enviar').textContent = 'Salvando pedido…';
  try {
    const r = await fetch('/api/convites', { method: 'POST', body: fd });
    const j = await r.json();
    if (!r.ok) throw new Error(j.erro || 'Não foi possível salvar o pedido.');
    sessionStorage.removeItem('fotoTeste');
    // checkout: o gateway deve voltar para /obrigado?pedido=<id>
    location.href = CONFIG.checkoutUrl ? CONFIG.checkoutUrl + encodeURIComponent(j.id) : `/obrigado?pedido=${j.id}`;
  } catch (err) {
    mostrarErro(err.message + ' Tente de novo em instantes.');
    $('enviar').disabled = false; $('enviar').textContent = 'Ir para o pagamento';
  }
};
