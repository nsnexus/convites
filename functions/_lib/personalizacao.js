// Valida e normaliza a personalização do convite (estilo, cores, fontes e blocos).
export const ESTILOS = ['classico', 'princesa', 'jardim', 'minimal', 'neon', 'ingresso', 'esportivo', 'hq', 'aquarela', 'rustico',
  'linho', 'mono', 'areia', 'salvia', 'sereno', 'rose', 'grafite', 'oliva', 'lavanda', 'noite'];
export const FONTES = ['', 'cormorant', 'playfair', 'dancing', 'bebas', 'bangers', 'unbounded', 'fredoka', 'amatic', 'pacifico', 'montserrat'];

const cor = (v) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : '');
const txt = (v, max) => String(v ?? '').trim().slice(0, max);
const sim = (v, padrao = false) => (v === undefined ? padrao : !!v);
const data = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? v : '');
const hora = (v) => (/^\d{2}:\d{2}$/.test(String(v || '')) ? v : '');

export function limparPersonalizacao(p = {}) {
  const b = p.blocos || {};
  const prog = b.programacao || {}, traje = b.traje || {}, pres = b.presentes || {}, rsvp = b.rsvp || {}, obs = b.observacoes || {};
  return {
    estilo: ESTILOS.includes(p.estilo) ? p.estilo : 'classico',
    cores: { destaque: cor(p.cores?.destaque), fundo: cor(p.cores?.fundo) },
    fonte: FONTES.includes(p.fonte) ? p.fonte : '',
    blocos: {
      contagem: sim(b.contagem, true),
      mapa: sim(b.mapa, true),
      programacao: {
        ativo: sim(prog.ativo),
        itens: (Array.isArray(prog.itens) ? prog.itens : []).slice(0, 12)
          .map(i => ({ hora: hora(i?.hora), texto: txt(i?.texto, 80) })).filter(i => i.texto),
      },
      traje: { ativo: sim(traje.ativo), texto: txt(traje.texto, 300), cores: (Array.isArray(traje.cores) ? traje.cores : []).map(cor).filter(Boolean).slice(0, 5) },
      presentes: {
        ativo: sim(pres.ativo),
        itens: (Array.isArray(pres.itens) ? pres.itens : []).map(i => txt(i, 80)).filter(Boolean).slice(0, 40),
        pix: txt(pres.pix, 120), tamanhos: txt(pres.tamanhos, 200),
      },
      rsvp: {
        ativo: sim(rsvp.ativo, true), criancas: sim(rsvp.criancas, true),
        limite: Math.min(30, Math.max(1, parseInt(rsvp.limite, 10) || 10)), prazo: data(rsvp.prazo),
      },
      observacoes: { ativo: sim(obs.ativo), texto: txt(obs.texto, 500) },
    },
  };
}
