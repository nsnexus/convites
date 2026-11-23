// Monta a parte do convite que vem depois do vídeo, a partir dos dados + personalização.
// Usado no convite de verdade (/c/...) e na prévia ao vivo do editor.
import { aplicarEstilo, personalizacaoPadrao } from './estilos.js';

const h = (tag, props = {}, ...filhos) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v != null && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...filhos.flat().filter(f => f != null && f !== false));
  return e;
};
const svg = (d) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', '22'); s.setAttribute('height', '22'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.innerHTML = d; return s; };
const ICONE = {
  data: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  local: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
};

export const tituloDe = c => c.titulo || `${c.homenageado || 'Aniversariante'}${c.idade ? `, ${c.idade} anos` : ''}`;
const dataHora = c => new Date(`${c.data || '2026-12-31'}T${c.hora || '00:00'}:00`);
const capital = s => s.charAt(0).toUpperCase() + s.slice(1);

let relogio;
export function renderizarConvite(raiz, c, { modo = 'real', aoConfirmar } = {}) {
  clearInterval(relogio);
  const p = mesclar(personalizacaoPadrao(), c.personalizacao || {});
  const b = p.blocos, dt = dataHora(c);
  const previa = modo !== 'real';
  const main = h('main', { class: `cv${modo === 'previa' ? ' em-previa' : ''}`, id: 'detalhes' });
  aplicarEstilo(main, p);
  const dentro = h('div', { class: 'cv-in' });
  main.append(dentro);

  // topo
  const quandoCurto = `${dt.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}${c.hora ? ` · ${c.hora.replace(':', 'h')}` : ''}`;
  dentro.append(h('header', { class: 'cv-topo' },
    h('p', { class: 'cv-chamada', text: 'Você está convidado para' }),
    h('h1', { class: 'cv-titulo', text: tituloDe(c) }),
    h('p', { class: 'cv-quando-curto', text: quandoCurto })));
  if (c.recado) dentro.append(h('p', { class: 'cv-recado', text: c.recado }));

  // contagem regressiva
  if (b.contagem) {
    const caixas = ['dias', 'horas', 'min', 'seg'].map(n => h('div', {}, h('b', { text: '0' }), h('span', { text: n })));
    const atualizar = () => {
      let s = Math.max(0, Math.floor((dt - Date.now()) / 1000));
      [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((v, i) => caixas[i].firstChild.textContent = v);
    };
    atualizar(); relogio = setInterval(atualizar, 1000);
    dentro.append(h('div', { class: 'cv-contagem', 'aria-label': 'Contagem regressiva' }, caixas));
  }

  // quando e onde
  const blocoInfo = h('section', { class: 'cv-bloco' }, h('h2', { text: 'Quando e onde' }),
    h('div', { class: 'cv-info' },
      h('div', { class: 'cv-cartao' }, svg(ICONE.data), h('div', {}, h('strong', { text: capital(dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })) }), h('span', { text: c.hora ? `às ${c.hora.replace(':', 'h')}` : '' }))),
      h('div', { class: 'cv-cartao' }, svg(ICONE.local), h('div', {}, h('strong', { text: c.local || 'Local da festa' }), h('span', { text: c.endereco || '' })))));
  const bts = h('div', { class: 'cv-bts' });
  if (b.mapa && c.endereco) bts.append(h('a', { class: 'cv-bt', target: '_blank', rel: 'noopener', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.local}, ${c.endereco}`)}`, text: 'Como chegar' }));
  bts.append(h('button', { class: 'cv-bt cv-bt-linha', type: 'button', text: 'Salvar na agenda', onclick: () => baixarAgenda(c, dt) }));
  blocoInfo.append(bts);
  dentro.append(blocoInfo);

  // programação
  if (b.programacao.ativo && b.programacao.itens.some(i => i.texto)) {
    dentro.append(h('section', { class: 'cv-bloco' }, h('h2', { text: 'Programação' }),
      h('ol', { class: 'cv-prog' }, b.programacao.itens.filter(i => i.texto).map(i => h('li', {}, i.hora ? h('b', { text: i.hora.replace(':', 'h') }) : null, h('span', { text: i.texto }))))));
  }

  // traje
  if (b.traje.ativo && (b.traje.texto || b.traje.cores.length)) {
    dentro.append(h('section', { class: 'cv-bloco' }, h('h2', { text: 'Sugestão de traje' }),
      h('div', { class: 'cv-cartao' }, b.traje.texto ? h('p', { text: b.traje.texto }) : null,
        b.traje.cores.length ? h('div', { class: 'cv-cores', 'aria-label': 'Cores sugeridas' }, b.traje.cores.map(cor => h('i', { style: `background:${cor}`, title: cor }))) : null)));
  }

  // presentes
  const pres = b.presentes;
  if (pres.ativo && (pres.itens.length || pres.pix || pres.tamanhos)) {
    const cart = h('div', { class: 'cv-cartao' });
    if (pres.itens.length) cart.append(h('ul', { class: 'cv-presentes' }, pres.itens.map(i => h('li', {}, h('span', { text: i }),
      c.presentes_escolhidos?.[i] ? h('small', { text: `${c.presentes_escolhidos[i]} já ${c.presentes_escolhidos[i] > 1 ? 'vão levar' : 'vai levar'}` }) : null))));
    if (pres.tamanhos) cart.append(h('p', { style: 'margin-top:12px', text: pres.tamanhos }));
    if (pres.pix) {
      const bt = h('button', { class: 'cv-bt cv-bt-linha', type: 'button', text: 'Copiar Pix', onclick: () => navigator.clipboard?.writeText(pres.pix).then(() => { bt.textContent = 'Pix copiado'; setTimeout(() => bt.textContent = 'Copiar Pix', 2000); }) });
      cart.append(h('div', { class: 'cv-pix' }, h('span', { text: 'Pix:' }), h('code', { text: pres.pix }), bt));
    }
    dentro.append(h('section', { class: 'cv-bloco' }, h('h2', { text: 'Sugestões de presente' }), cart));
  }

  // observações
  if (b.observacoes.ativo && b.observacoes.texto) dentro.append(h('section', { class: 'cv-bloco' }, h('h2', { text: 'Importante' }), h('div', { class: 'cv-cartao' }, h('p', { text: b.observacoes.texto }))));

  // confirmação de presença
  if (b.rsvp.ativo) dentro.append(blocoRsvp(c, b, { previa, aoConfirmar }));

  dentro.append(h('p', { class: 'cv-rodape' }, 'Convite feito com ', h('a', { href: '/', target: '_top', text: 'NS Convites' })));
  raiz.replaceChildren(main);
  return main;
}

function blocoRsvp(c, b, { previa, aoConfirmar }) {
  const r = b.rsvp, sec = h('section', { class: 'cv-bloco', id: 'presenca' }, h('h2', { text: 'Confirme sua presença' }));
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  if (r.prazo) sec.append(h('p', { class: 'cv-aviso', style: 'margin:-6px 0 14px', text: `Responda até ${new Date(r.prazo + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}.` }));
  if (r.prazo && hoje > r.prazo && !previa) { sec.append(h('div', { class: 'cv-cartao' }, h('p', { text: 'O prazo para confirmar presença terminou.' }))); return sec; }

  const qtd = { adultos: 1, criancas: 0 };
  const contador = (campo, rotulo, min) => {
    const out = h('output', { text: String(qtd[campo]) });
    const mudar = d => { const tot = qtd.adultos + qtd.criancas; if (d > 0 && tot >= r.limite) return; qtd[campo] = Math.max(min, qtd[campo] + d); out.textContent = qtd[campo]; };
    return h('div', { class: 'campo-cv' }, h('label', { text: rotulo }),
      h('div', { class: 'cv-contador' }, h('button', { type: 'button', 'aria-label': `Menos ${rotulo}`, text: '−', onclick: () => mudar(-1) }), out, h('button', { type: 'button', 'aria-label': `Mais ${rotulo}`, text: '+', onclick: () => mudar(1) })));
  };
  const erro = h('p', { class: 'cv-erro', hidden: true });
  const nome = h('input', { id: 'rsvpNome', autocomplete: 'name', maxlength: '80' });
  const blocoVai = h('div', {},
    h('div', { class: 'cv-qtd' }, contador('adultos', 'Adultos (com você)', 1), r.criancas ? contador('criancas', 'Crianças', 0) : null),
    h('p', { class: 'cv-aviso', style: 'margin:-4px 0 14px', text: `Até ${r.limite} ${r.limite > 1 ? 'pessoas' : 'pessoa'} por confirmação.` }));
  const pres = b.presentes;
  if (pres.ativo && pres.itens.length) blocoVai.append(h('div', { class: 'campo-cv' }, h('label', { text: 'Vai levar algum presente da lista? (opcional)' }),
    h('div', { class: 'cv-escolhas' }, pres.itens.map(i => h('label', { class: 'cv-escolha' }, h('input', { type: 'radio', name: 'presente', value: i }), h('span', { text: i }),
      c.presentes_escolhidos?.[i] ? h('small', { text: `${c.presentes_escolhidos[i]} já escolheram` }) : null)))));
  const sn = (v, t) => h('label', {}, h('input', { type: 'radio', name: 'vai', value: v, onchange: () => { blocoVai.hidden = v !== 'sim'; } }), t);
  const recado = h('textarea', { id: 'rsvpRecado', maxlength: '300' });
  const enviar = h('button', { class: 'cv-bt', style: 'width:100%', type: 'submit', text: previa ? 'Disponível depois de liberar o convite' : 'Enviar resposta', disabled: previa });
  const form = h('form', { class: 'cv-form', novalidate: true },
    h('div', { class: 'campo-cv' }, h('label', { for: 'rsvpNome', text: 'Seu nome' }), nome),
    h('div', { class: 'cv-sn' }, sn('sim', 'Vou sim'), sn('nao', 'Não vou poder')),
    blocoVai,
    h('div', { class: 'campo-cv' }, h('label', { for: 'rsvpRecado', text: `Recado para ${c.homenageado || 'o aniversariante'} (opcional)` }), recado),
    erro, enviar);
  blocoVai.hidden = true;
  form.addEventListener('submit', async e => {
    e.preventDefault(); erro.hidden = true;
    const vai = form.querySelector('[name=vai]:checked')?.value;
    if (!nome.value.trim()) { nome.focus(); return mostrar('Escreva seu nome.'); }
    if (!vai) return mostrar('Escolha se você vai ou não.');
    enviar.disabled = true;
    const corpo = { slug: c.slug, nome: nome.value.trim(), vai: vai === 'sim', adultos: qtd.adultos, criancas: qtd.criancas, presente: form.querySelector('[name=presente]:checked')?.value || null, recado: recado.value || null };
    try {
      await aoConfirmar?.(corpo);
      form.replaceWith(h('div', { class: 'cv-cartao cv-ok' }, h('strong', { text: corpo.vai ? 'Presença confirmada!' : 'Resposta enviada' }),
        h('span', { text: corpo.vai ? `Obrigado, ${corpo.nome}! Te esperamos lá.` : `Obrigado por avisar, ${corpo.nome}.` })));
    } catch (err) { mostrar(err.message || 'A resposta não foi enviada. Tente de novo.'); enviar.disabled = false; }
  });
  function mostrar(t) { erro.textContent = t; erro.hidden = false; }
  sec.append(form);
  return sec;
}

function baixarAgenda(c, dt) {
  const p = n => String(n).padStart(2, '0');
  const f = d => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NS Convites//PT', 'BEGIN:VEVENT', `UID:${c.slug}@nsconvites`, `DTSTART:${f(dt)}`, `DTEND:${f(new Date(+dt + 4 * 3600e3))}`,
    `SUMMARY:${tituloDe(c)}`, `LOCATION:${c.local || ''} - ${c.endereco || ''}`, `DESCRIPTION:${location.href}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'festa.ics'; a.click();
}

// junta a personalização salva com a padrão (campos que faltarem ficam com o padrão)
function mesclar(base, p) {
  const out = { ...base, ...p, cores: { ...base.cores, ...(p.cores || {}) }, blocos: { ...base.blocos } };
  for (const [k, v] of Object.entries(p.blocos || {})) out.blocos[k] = typeof v === 'object' && v && !Array.isArray(v) ? { ...base.blocos[k], ...v } : v;
  return out;
}
