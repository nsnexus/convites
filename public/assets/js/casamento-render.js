// Página do convite de casamento: seções que entram ao rolar, ornamentos com parallax,
// programação com marcador que acompanha a rolagem e confirmação pelo selo "RSVP".
import { aplicarEstilo } from './estilos.js?v=d5c0644b';

const h = (tag, props = {}, ...filhos) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v != null && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...filhos.flat().filter(f => f != null && f !== false));
  return e;
};

// Ramo botânico em traço fino (usa a cor de destaque via currentColor)
const RAMO = `<svg viewBox="0 0 300 220" fill="none" stroke="currentColor" stroke-linecap="round">
<path d="M8 12 C70 30 120 60 150 110 C170 145 185 175 230 205" stroke-width="1.6"/>
<path d="M60 30 C70 12 92 8 104 14 C92 26 76 32 60 30Z" fill="currentColor" fill-opacity=".18" stroke-width="1.2"/>
<path d="M96 52 C112 36 136 36 146 44 C132 56 114 60 96 52Z" fill="currentColor" fill-opacity=".18" stroke-width="1.2"/>
<path d="M78 46 C64 62 62 86 70 96 C82 82 86 64 78 46Z" fill="currentColor" fill-opacity=".14" stroke-width="1.2"/>
<path d="M132 92 C152 82 174 88 182 98 C164 106 146 104 132 92Z" fill="currentColor" fill-opacity=".18" stroke-width="1.2"/>
<path d="M122 100 C110 118 112 140 120 150 C130 136 132 118 122 100Z" fill="currentColor" fill-opacity=".14" stroke-width="1.2"/>
<path d="M166 150 C184 146 204 154 210 166 C192 170 176 166 166 150Z" fill="currentColor" fill-opacity=".18" stroke-width="1.2"/>
<path d="M30 18 C34 34 30 48 22 56" stroke-width="1"/><path d="M190 182 C196 170 206 164 218 164" stroke-width="1"/>
<g fill="currentColor" stroke="none"><circle cx="22" cy="58" r="3"/><circle cx="16" cy="50" r="2.2"/><circle cx="218" cy="164" r="3"/><circle cx="226" cy="158" r="2.2"/><circle cx="150" cy="110" r="2.4"/></g>
<g stroke-width="1.1"><circle cx="104" cy="74" r="9"/><circle cx="104" cy="74" r="3.5" fill="currentColor" fill-opacity=".35"/>
<path d="M104 65 C108 58 116 60 114 68 M113 74 C120 76 120 85 112 83 M104 83 C100 90 92 88 94 80 M95 74 C88 70 90 62 97 66"/></g>
</svg>`;
const ornamentos = (...pos) => pos.map(p => { const d = h('div', { class: `cs-orn ${p}`, 'aria-hidden': 'true', 'data-paralaxe': p.startsWith('t') ? '-0.08' : '0.06' }); d.innerHTML = RAMO; return d; });

const dataHora = c => new Date(`${c.data || '2026-12-31'}T${c.hora || '00:00'}:00`);
const hm = t => (t || '').replace(':', 'h');
const capital = s => s.charAt(0).toUpperCase() + s.slice(1);
export const nomesCasal = c => { const k = c.personalizacao?.casal || {}; return [k.nome1 || 'Noiva', k.nome2 || 'Noivo']; };
export const iniciaisCasal = c => { const k = c.personalizacao?.casal || {}; if (k.iniciais) return k.iniciais; const [a, b] = nomesCasal(c); return `${a[0] || ''}&${b[0] || ''}`; };

let limpar = () => {};
export function renderizarCasamento(raiz, c, { modo = 'real', aoConfirmar } = {}) {
  const anterior = limpar; limpar = () => {}; anterior();
  const p = c.personalizacao || {}, b = p.blocos || {};
  const previa = modo !== 'real';
  const [n1, n2] = nomesCasal(c), dt = dataHora(c);
  const main = h('main', { class: 'cs', id: 'detalhes' });
  aplicarEstilo(main, { ...p, estilo: (p.estilo || '').startsWith('cas-') ? p.estilo : 'cas-bordo' });

  // capa
  const dataCurta = `${String(dt.getDate()).padStart(2, '0')} . ${String(dt.getMonth() + 1).padStart(2, '0')} . ${dt.getFullYear()}`;
  const capa = h('section', { class: 'cs-capa' }, ornamentos('te', 'td', 'be', 'bd'),
    h('div', {}, h('p', { class: 'cs-sub', text: 'Nós vamos nos casar' }),
      h('h1', { class: 'cs-nomes' }, h('span', { text: n1 }), h('span', { class: 'e', text: '&' }), h('span', { text: n2 })),
      h('p', { class: 'cs-data', text: dataCurta })),
    h('div', { class: 'cs-rolar', 'aria-hidden': 'true' }, 'role para baixo', h('i')));
  main.append(capa);

  // convite
  const textoConvite = b.convite?.texto || 'Com a bênção de Deus e de nossas famílias, temos a alegria de convidar você para celebrar conosco o dia em que uniremos nossas vidas.';
  main.append(h('section', { class: 'cs-sec' },
    h('div', { class: 'cs-papel cs-convite rv papel' },
      h('div', { class: 'cs-selo', 'aria-hidden': 'true' }, h('span', { text: iniciaisCasal(c) })),
      h('p', { text: textoConvite }),
      b.convite?.versiculo ? h('p', { class: 'cs-versiculo', text: b.convite.versiculo }) : null,
      h('p', { class: 'cs-assina', text: `${n1} & ${n2}` }))));

  // contagem
  if (b.contagem !== false) {
    const meds = ['dias', 'horas', 'min', 'seg'].map((n, i) => h('div', { class: 'cs-med rv zoom', 'data-atraso': i + 1 }, h('b', { text: '0' }), h('small', { text: n })));
    const tick = () => { const s = Math.max(0, Math.floor((dt - Date.now()) / 1000)); [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((v, i) => meds[i].firstChild.textContent = v); };
    tick(); const rel = setInterval(tick, 1000);
    const antes = limpar; limpar = () => { clearInterval(rel); antes(); };
    main.append(h('section', { class: 'cs-sec' }, h('p', { class: 'cs-sub rv', text: 'Falta pouco' }), h('h2', { class: 'cs-tit rv', text: 'Contagem regressiva' }), h('div', { class: 'cs-contagem' }, meds)));
  }

  // cerimônia e recepção
  const card = (titulo, hora, local, end, atraso) => h('div', { class: 'cs-local rv papel', 'data-atraso': atraso },
    h('h3', { text: titulo }), hora ? h('span', { class: 'hora', text: `às ${hm(hora)}` }) : null,
    h('strong', { text: local || 'Local' }), end ? h('span', { class: 'end', text: end }) : null,
    h('div', { class: 'cs-bts' }, b.mapa !== false && end ? h('a', { class: 'cs-bt', target: '_blank', rel: 'noopener', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${local}, ${end}`)}`, text: 'Como chegar' }) : null));
  const rec = b.recepcao || {};
  main.append(h('section', { class: 'cs-sec' }, h('div', { class: 'cs-div rv', 'aria-hidden': 'true', text: '❦' }),
    h('p', { class: 'cs-sub rv', text: capital(dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) }),
    h('h2', { class: 'cs-tit rv', text: rec.ativo ? 'Cerimônia e recepção' : 'Cerimônia' }),
    h('div', { class: 'cs-locais' }, card('Cerimônia', c.hora, c.local, c.endereco, 1), rec.ativo ? card('Recepção', rec.hora, rec.local, rec.endereco, 2) : null),
    h('div', { class: 'cs-bts rv' }, h('button', { class: 'cs-bt cheio', type: 'button', text: 'Salvar na agenda', onclick: () => agenda(c, dt, n1, n2) }))));

  // programação
  const prog = (b.programacao?.itens || []).filter(i => i.texto);
  let secProg;
  if (b.programacao?.ativo && prog.length) {
    secProg = h('div', { class: 'cs-prog' }, h('div', { class: 'linha' }, h('i')), h('div', { class: 'marca', 'aria-hidden': 'true' }),
      h('ol', {}, prog.map((i, k) => h('li', { class: 'rv', 'data-atraso': (k % 3) + 1 }, h('b', { text: hm(i.hora) }), h('span', { text: i.texto })))));
    main.append(h('section', { class: 'cs-sec' }, h('p', { class: 'cs-sub rv', text: 'O grande dia' }), h('h2', { class: 'cs-tit rv', text: 'Programação' }), secProg));
  }

  // traje
  const tr = b.traje || {};
  if (tr.ativo && (tr.texto || tr.cores?.length || tr.evitar?.length)) {
    main.append(h('section', { class: 'cs-sec' }, ornamentos('te'), h('p', { class: 'cs-sub rv', text: 'Dress code' }), h('h2', { class: 'cs-tit rv', text: 'Traje' }),
      tr.texto ? h('p', { class: 'cs-txt rv', text: tr.texto }) : null,
      tr.cores?.length ? [h('p', { class: 'cs-rot rv', text: 'Cores sugeridas' }), h('div', { class: 'cs-cores rv' }, tr.cores.map(cor => h('i', { style: `background:${cor}` })))] : null,
      tr.evitar?.length ? [h('p', { class: 'cs-rot rv', text: 'Evite' }), h('div', { class: 'cs-cores evitar rv' }, tr.evitar.map(cor => h('i', { style: `background:${cor}` })))] : null));
  }

  // nossa história
  if (b.historia?.ativo && b.historia.texto) {
    main.append(h('section', { class: 'cs-sec' }, h('div', { class: 'cs-arco rv papel' }, h('p', { class: 'cs-sub', text: 'Nossa história' }), h('h2', { class: 'cs-tit', text: `${n1} & ${n2}` }), h('p', { text: b.historia.texto }))));
  }

  // presentes
  const pr = b.presentes || {};
  if (pr.ativo && (pr.itens?.length || pr.pix || pr.banco || pr.link || pr.texto)) {
    const sec = h('section', { class: 'cs-sec' }, ornamentos('td'), h('p', { class: 'cs-sub rv', text: 'Presentes' }), h('h2', { class: 'cs-tit rv', text: 'Sua presença é o nosso presente' }),
      h('p', { class: 'cs-txt rv', text: pr.texto || 'Se quiser nos presentear, deixamos algumas sugestões com carinho.' }));
    if (pr.itens?.length) sec.append(h('ul', { class: 'cs-pres rv', style: 'padding:0' }, pr.itens.map(i => h('li', {}, h('span', { text: i }), c.presentes_escolhidos?.[i] ? h('small', { text: `${c.presentes_escolhidos[i]} já escolheram` }) : null))));
    if (pr.link) sec.append(h('div', { class: 'cs-bts rv' }, h('a', { class: 'cs-bt cheio', href: pr.link, target: '_blank', rel: 'noopener', text: 'Ver lista de presentes' })));
    if (pr.pix || pr.banco) {
      const box = h('div', { class: 'cs-pix rv papel' });
      if (pr.pix) { const bt = h('button', { class: 'cs-bt', type: 'button', text: 'Copiar Pix', onclick: () => navigator.clipboard?.writeText(pr.pix).then(() => { bt.textContent = 'Pix copiado'; setTimeout(() => bt.textContent = 'Copiar Pix', 2000); }) }); box.append(h('p', { class: 'cs-sub', text: 'Chave Pix' }), h('code', { text: pr.pix }), bt); }
      if (pr.banco) box.append(h('p', { class: 'cs-banco', text: pr.banco }));
      sec.append(box);
    }
    main.append(sec);
  }

  // informações
  if (b.observacoes?.ativo && b.observacoes.texto) main.append(h('section', { class: 'cs-sec' }, h('p', { class: 'cs-sub rv', text: 'Para os convidados' }), h('h2', { class: 'cs-tit rv', text: 'Informações' }), h('p', { class: 'cs-txt rv', style: 'white-space:pre-line', text: b.observacoes.texto })));

  // confirmação
  if (b.rsvp?.ativo !== false) main.append(blocoRsvp(c, b, { previa, aoConfirmar, n1, n2 }));

  // fim
  main.append(h('section', { class: 'cs-sec cs-fim' }, ornamentos('be', 'bd'),
    h('p', { class: 'cs-sub rv', text: p.encerramento || 'Esperamos você' }),
    h('h2', { class: 'cs-nomes rv' }, h('span', { text: n1 }), h('span', { class: 'e', text: '&' }), h('span', { text: n2 })),
    h('p', { class: 'cs-data rv', text: dataCurta })),
    h('p', { class: 'cs-rodape' }, 'Convite feito com ', h('a', { href: '/', target: '_top', text: 'NS Convites' })));

  raiz.replaceChildren(main);
  animar(main, capa, secProg);
  return main;
}

function blocoRsvp(c, b, { previa, aoConfirmar, n1, n2 }) {
  const r = b.rsvp || {}, limite = r.limite || 10;
  const sec = h('section', { class: 'cs-sec', id: 'presenca' }, h('p', { class: 'cs-sub rv', text: 'RSVP' }), h('h2', { class: 'cs-tit rv', text: 'Confirme sua presença' }));
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  if (r.prazo) sec.append(h('p', { class: 'cs-txt rv', text: `Pedimos que confirme até ${new Date(r.prazo + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}.` }));
  if (r.prazo && hoje > r.prazo && !previa) { sec.append(h('p', { class: 'cs-txt', style: 'margin-top:20px!important', text: 'O prazo para confirmar presença terminou.' })); return sec; }
  const qtd = { adultos: 1, criancas: 0 };
  const cont = (campo, rot, min) => { const o = h('output', { text: String(qtd[campo]) }); const mudar = d => { if (d > 0 && qtd.adultos + qtd.criancas >= limite) return; qtd[campo] = Math.max(min, qtd[campo] + d); o.textContent = qtd[campo]; };
    return h('div', {}, h('label', { text: rot }), h('div', { class: 'cs-cont' }, h('button', { type: 'button', 'aria-label': `Menos ${rot}`, text: '−', onclick: () => mudar(-1) }), o, h('button', { type: 'button', 'aria-label': `Mais ${rot}`, text: '+', onclick: () => mudar(1) }))); };
  const nome = h('input', { id: 'csNome', autocomplete: 'name', maxlength: '80' });
  const restr = r.restricoes ? h('input', { id: 'csRestr', maxlength: '200', placeholder: 'Ex.: vegetariano, alergia a camarão' }) : null;
  const vaiBox = h('div', { hidden: true }, h('div', { class: 'cs-qtd' }, cont('adultos', 'Adultos', 1), r.criancas !== false ? cont('criancas', 'Crianças', 0) : null),
    restr ? [h('label', { for: 'csRestr', text: 'Restrição alimentar (opcional)' }), restr] : null);
  const sn = (v, t) => h('label', {}, h('input', { type: 'radio', name: 'csVai', value: v, onchange: () => vaiBox.hidden = v !== 'sim' }), t);
  const msg = h('textarea', { id: 'csMsg', rows: '3', maxlength: '300' });
  const erro = h('p', { class: 'cs-erro', hidden: true });
  const enviar = h('button', { class: 'cs-bt cheio', style: 'width:100%', type: 'submit', text: previa ? 'Disponível depois de liberar o convite' : 'Enviar confirmação', disabled: previa });
  const form = h('form', { class: 'cs-form', hidden: true, novalidate: true },
    h('label', { for: 'csNome', text: 'Seu nome' }), nome, h('div', { class: 'cs-sn' }, sn('sim', 'Estarei presente'), sn('nao', 'Não poderei ir')), vaiBox,
    h('label', { for: 'csMsg', text: `Mensagem para ${n1} & ${n2} (opcional)` }), msg, erro, enviar);
  const selo = h('button', { class: 'cs-rsvp-selo rv zoom', type: 'button', 'aria-label': 'Abrir confirmação de presença', onclick: () => { form.hidden = false; selo.hidden = true; toque.hidden = true; form.scrollIntoView({ behavior: 'smooth', block: 'center' }); nome.focus({ preventScroll: true }); } }, h('span', { text: 'RSVP' }));
  const toque = h('p', { class: 'cs-toque rv', text: 'Toque no selo para confirmar' });
  form.addEventListener('submit', async e => {
    e.preventDefault(); erro.hidden = true;
    const vai = form.querySelector('[name=csVai]:checked')?.value;
    if (!nome.value.trim()) { nome.focus(); return mostrar('Escreva seu nome.'); }
    if (!vai) return mostrar('Escolha se você vai ou não.');
    enviar.disabled = true;
    const corpo = { slug: c.slug, nome: nome.value.trim(), vai: vai === 'sim', adultos: qtd.adultos, criancas: qtd.criancas, restricoes: restr?.value || null, recado: msg.value || null };
    try { await aoConfirmar?.(corpo); form.replaceWith(h('div', { class: 'cs-form', style: 'text-align:center' }, h('p', { class: 'cs-ok', text: corpo.vai ? 'Obrigado!' : 'Recebido' }), h('p', { class: 'cs-txt', text: corpo.vai ? `${corpo.nome}, sua presença está confirmada. Até lá!` : `Obrigado por avisar, ${corpo.nome}.` }))); }
    catch (err) { mostrar(err.message || 'Não foi possível enviar. Tente de novo.'); enviar.disabled = false; }
  });
  function mostrar(t) { erro.textContent = t; erro.hidden = false; }
  sec.append(selo, toque, form);
  return sec;
}

// entradas ao rolar, parallax dos ornamentos e marcador da programação
function animar(main, capa, prog) {
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => capa.classList.add('ativa'));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  main.querySelectorAll('.rv').forEach(el => io.observe(el));
  if (reduz) { main.querySelectorAll('.rv').forEach(el => el.classList.add('visto')); return; }
  const orns = [...main.querySelectorAll('[data-paralaxe]')];
  let pedido = false;
  const quadro = () => {
    pedido = false;
    const vh = innerHeight;
    for (const o of orns) {
      const r = o.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) continue;
      const f = +o.dataset.paralaxe, base = o.classList.contains('td') ? 'scaleX(-1)' : o.classList.contains('be') ? 'scaleY(-1)' : o.classList.contains('bd') ? 'scale(-1,-1)' : '';
      o.style.transform = `translateY(${((r.top + r.height / 2) - vh / 2) * f}px) ${base}`;
    }
    if (prog) { const r = prog.getBoundingClientRect(); const t = Math.min(1, Math.max(0, (vh * .55 - r.top) / r.height)); prog.style.setProperty('--prog', `${(t * 100).toFixed(1)}%`); }
  };
  const aoRolar = () => { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } };
  addEventListener('scroll', aoRolar, { passive: true }); quadro();
  const antes = limpar; limpar = () => { removeEventListener('scroll', aoRolar); io.disconnect(); antes(); };
}

function agenda(c, dt, n1, n2) {
  const p = n => String(n).padStart(2, '0'), f = d => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NS Convites//PT', 'BEGIN:VEVENT', `UID:${c.slug}@nsconvites`, `DTSTART:${f(dt)}`, `DTEND:${f(new Date(+dt + 6 * 3600e3))}`,
    `SUMMARY:Casamento ${n1} & ${n2}`, `LOCATION:${c.local || ''} - ${c.endereco || ''}`, `DESCRIPTION:${location.href}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'casamento.ics'; a.click();
}
