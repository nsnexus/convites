// Os 10 estilos do convite. Cada um define cores, fontes e o "jeito" (data-estilo no CSS).
export const ESTILOS = [
  { id: 'classico',  nome: 'Clássico',      cores: { fundo: '#fbf7f0', texto: '#2b2118', destaque: '#a9814c' }, titulo: 'cormorant', corpo: 'Lato' },
  { id: 'princesa',  nome: 'Princesa',      cores: { fundo: '#fff1f6', texto: '#5b2340', destaque: '#e0628f' }, titulo: 'playfair',  corpo: 'Nunito' },
  { id: 'jardim',    nome: 'Jardim',        cores: { fundo: '#f2f6ee', texto: '#233a2a', destaque: '#5f8f52' }, titulo: 'cormorant', corpo: 'Karla' },
  { id: 'minimal',   nome: 'Minimalista',   cores: { fundo: '#ffffff', texto: '#141414', destaque: '#141414' }, titulo: 'montserrat', corpo: 'Manrope' },
  { id: 'neon',      nome: 'Neon',          cores: { fundo: '#0f0a22', texto: '#f4f1ff', destaque: '#ff3dcb' }, titulo: 'unbounded', corpo: 'Manrope' },
  { id: 'ingresso',  nome: 'Ingresso VIP',  cores: { fundo: '#1e2944', texto: '#f6f3ea', destaque: '#ffc63d' }, titulo: 'bebas',     corpo: 'Barlow' },
  { id: 'esportivo', nome: 'Esportivo',     cores: { fundo: '#0e4a2f', texto: '#ffffff', destaque: '#ffd400' }, titulo: 'bebas',     corpo: 'Barlow' },
  { id: 'hq',        nome: 'Quadrinhos',    cores: { fundo: '#ffe14d', texto: '#141414', destaque: '#e6232a' }, titulo: 'bangers',   corpo: 'Comic Neue' },
  { id: 'aquarela',  nome: 'Aquarela',      cores: { fundo: '#f7f1fb', texto: '#3b3355', destaque: '#8c7ae6' }, titulo: 'dancing',   corpo: 'Quicksand' },
  { id: 'rustico',   nome: 'Rústico',       cores: { fundo: '#ecdcc6', texto: '#3e2c1c', destaque: '#8b5e34' }, titulo: 'amatic',    corpo: 'Josefin Sans' },
];

// Fontes de título que o cliente pode escolher
export const FONTES = {
  cormorant: { nome: 'Elegante', css: "'Cormorant Garamond', serif", google: 'Cormorant+Garamond:wght@500;700' },
  playfair:  { nome: 'Clássica', css: "'Playfair Display', serif", google: 'Playfair+Display:ital,wght@0,700;1,600' },
  dancing:   { nome: 'Manuscrita', css: "'Dancing Script', cursive", google: 'Dancing+Script:wght@600;700' },
  pacifico:  { nome: 'Divertida', css: "'Pacifico', cursive", google: 'Pacifico' },
  fredoka:   { nome: 'Infantil', css: "'Fredoka', sans-serif", google: 'Fredoka:wght@500;700' },
  montserrat:{ nome: 'Moderna', css: "'Montserrat', sans-serif", google: 'Montserrat:wght@600;800' },
  unbounded: { nome: 'Futurista', css: "'Unbounded', sans-serif", google: 'Unbounded:wght@600;800' },
  bebas:     { nome: 'Impacto', css: "'Bebas Neue', sans-serif", google: 'Bebas+Neue' },
  bangers:   { nome: 'Gibi', css: "'Bangers', cursive", google: 'Bangers' },
  amatic:    { nome: 'Artesanal', css: "'Amatic SC', cursive", google: 'Amatic+SC:wght@700' },
};
const CORPO_GOOGLE = { Lato: 'Lato:wght@400;700', Nunito: 'Nunito:wght@400;700', Karla: 'Karla:wght@400;700', Manrope: 'Manrope:wght@400;700',
  Barlow: 'Barlow:wght@400;600', 'Comic Neue': 'Comic+Neue:wght@400;700', Quicksand: 'Quicksand:wght@400;600', 'Josefin Sans': 'Josefin+Sans:wght@400;600' };

// Estilo sugerido para cada categoria da vitrine
export const ESTILO_DA_CATEGORIA = { '15-anos': 'princesa', futebol: 'esportivo', herois: 'hq', aventura: 'jardim' };

export const estiloPorId = id => ESTILOS.find(e => e.id === id) || ESTILOS[0];

// mistura duas cores hex (t=0 -> a, t=1 -> b)
function mistura(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const luz = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255); return .2126 * r + .7152 * g + .0722 * b; };

// Aplica estilo + ajustes do cliente num elemento (variáveis CSS) e carrega as fontes
export function aplicarEstilo(el, pers = {}) {
  const e = estiloPorId(pers.estilo);
  const fundo = pers.cores?.fundo || e.cores.fundo;
  const destaque = pers.cores?.destaque || e.cores.destaque;
  // texto: se o cliente mudou o fundo, escolhe claro/escuro pelo contraste
  const texto = pers.cores?.fundo ? (luz(fundo) > .5 ? '#1c1424' : '#f7f4fb') : e.cores.texto;
  const fonteT = FONTES[pers.fonte] || FONTES[e.titulo];
  el.dataset.estilo = e.id;
  const v = {
    '--fundo': fundo, '--texto': texto, '--destaque': destaque,
    '--texto-2': mistura(texto, fundo, .35), '--linha': mistura(texto, fundo, .82),
    '--cartao': luz(fundo) > .5 ? mistura(fundo, '#ffffff', .65) : mistura(fundo, '#ffffff', .07),
    '--sobre-destaque': luz(destaque) > .55 ? '#141414' : '#ffffff',
    '--destaque-suave': mistura(destaque, fundo, .82),
    '--f-titulo': fonteT.css, '--f-corpo': `'${e.corpo}', system-ui, sans-serif`,
  };
  for (const [k, val] of Object.entries(v)) el.style.setProperty(k, val);
  carregarFontes([fonteT.google, CORPO_GOOGLE[e.corpo]]);
  return e;
}

const carregadas = new Set();
export function carregarFontes(lista) {
  const novas = lista.filter(f => f && !carregadas.has(f));
  if (!novas.length) return;
  novas.forEach(f => carregadas.add(f));
  const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?${novas.map(f => `family=${f}`).join('&')}&display=swap`;
  document.head.append(l);
}

// Personalização inicial de um convite novo
export function personalizacaoPadrao(categoria) {
  return {
    estilo: ESTILO_DA_CATEGORIA[categoria] || 'classico', cores: { destaque: '', fundo: '' }, fonte: '',
    blocos: {
      contagem: true, mapa: true,
      programacao: { ativo: false, itens: [{ hora: '', texto: '' }] },
      traje: { ativo: false, texto: '', cores: [] },
      presentes: { ativo: false, itens: [], pix: '', tamanhos: '' },
      rsvp: { ativo: true, criancas: true, limite: 6, prazo: '' },
      observacoes: { ativo: false, texto: '' },
    },
  };
}
