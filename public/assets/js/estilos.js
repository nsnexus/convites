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
  // Minimalistas
  { id: 'linho',     nome: 'Linho',         grupo: 'min', cores: { fundo: '#f6f4ef', texto: '#2a2a28', destaque: '#8a8578' }, titulo: 'cormorant', corpo: 'Manrope' },
  { id: 'mono',      nome: 'Monocromático', grupo: 'min', cores: { fundo: '#121212', texto: '#f2f2f2', destaque: '#f2f2f2' }, titulo: 'montserrat', corpo: 'Manrope' },
  { id: 'areia',     nome: 'Areia',         grupo: 'min', cores: { fundo: '#efe6da', texto: '#4a3f35', destaque: '#a87c5f' }, titulo: 'cormorant', corpo: 'Karla' },
  { id: 'salvia',    nome: 'Sálvia',        grupo: 'min', cores: { fundo: '#e9eee6', texto: '#2f3b32', destaque: '#6f8a69' }, titulo: 'playfair',  corpo: 'Karla' },
  { id: 'sereno',    nome: 'Sereno',        grupo: 'min', cores: { fundo: '#eef2f6', texto: '#1f2a37', destaque: '#4f6f8f' }, titulo: 'montserrat', corpo: 'Manrope' },
  { id: 'rose',      nome: 'Rosé',          grupo: 'min', cores: { fundo: '#f8efed', texto: '#4b3436', destaque: '#c0807b' }, titulo: 'cormorant', corpo: 'Nunito' },
  { id: 'grafite',   nome: 'Grafite',       grupo: 'min', cores: { fundo: '#f2f2f0', texto: '#1e1e1e', destaque: '#e2b93b' }, titulo: 'montserrat', corpo: 'Manrope' },
  { id: 'oliva',     nome: 'Oliva',         grupo: 'min', cores: { fundo: '#f4f1e8', texto: '#3a3a2a', destaque: '#6b6b3a' }, titulo: 'playfair',  corpo: 'Karla' },
  { id: 'lavanda',   nome: 'Lavanda',       grupo: 'min', cores: { fundo: '#f3f0f8', texto: '#352f45', destaque: '#8a78c2' }, titulo: 'fredoka',   corpo: 'Nunito' },
  { id: 'noite',     nome: 'Noite',         grupo: 'min', cores: { fundo: '#14182b', texto: '#e9ecf5', destaque: '#c9b37e' }, titulo: 'cormorant', corpo: 'Manrope' },
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
// luminância relativa (WCAG) e qual texto contrasta mais sobre uma cor
const lumRel = h => { const v = [1, 3, 5].map(i => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const textoSobre = h => { const L = lumRel(h); return (1.05 / (L + .05)) >= ((L + .05) / (lumRel('#141414') + .05)) ? '#ffffff' : '#141414'; };

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
    '--sobre-destaque': textoSobre(destaque),
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
