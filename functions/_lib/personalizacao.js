// Valida e normaliza a personalização do convite (estilo, cores, fontes e blocos).
export const ESTILOS = ['classico', 'princesa', 'jardim', 'minimal', 'neon', 'ingresso', 'esportivo', 'hq', 'aquarela', 'rustico',
  'linho', 'mono', 'areia', 'salvia', 'sereno', 'rose', 'grafite', 'oliva', 'lavanda', 'noite',
  'cas-salvia', 'cas-bordo', 'cas-rose', 'cas-marfim', 'cas-marinho'];
export const FONTES = ['', 'cormorant', 'playfair', 'dancing', 'bebas', 'bangers', 'unbounded', 'fredoka', 'amatic', 'pacifico', 'montserrat', 'greatvibes', 'pinyon', 'italiana'];

const cor = (v) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : '');
const txt = (v, max) => String(v ?? '').trim().slice(0, max);
const sim = (v, padrao = false) => (v === undefined ? padrao : !!v);
const data = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? v : '');
const hora = (v) => (/^\d{2}:\d{2}$/.test(String(v || '')) ? v : '');
const url = (v) => (/^https?:\/\/\S+$/i.test(String(v || '').trim()) ? String(v).trim().slice(0, 300) : '');

export function limparPersonalizacao(p = {}) {
  const b = p.blocos || {};
  const prog = b.programacao || {}, traje = b.traje || {}, pres = b.presentes || {}, rsvp = b.rsvp || {}, obs = b.observacoes || {};
  const casal = p.casal || {}, conv = b.convite || {}, rec = b.recepcao || {}, hist = b.historia || {};
  return {
    estilo: ESTILOS.includes(p.estilo) ? p.estilo : 'classico',
    cores: { destaque: cor(p.cores?.destaque), fundo: cor(p.cores?.fundo) },
    fonte: FONTES.includes(p.fonte) ? p.fonte : '',
    casal: { nome1: txt(casal.nome1, 40), nome2: txt(casal.nome2, 40), iniciais: txt(casal.iniciais, 7) },
    encerramento: txt(p.encerramento, 200),
    blocos: {
      contagem: sim(b.contagem, true),
      convite: { texto: txt(conv.texto, 600), versiculo: txt(conv.versiculo, 300) },
      recepcao: { ativo: sim(rec.ativo), local: txt(rec.local, 120), endereco: txt(rec.endereco, 200), hora: hora(rec.hora) },
      historia: { ativo: sim(hist.ativo), texto: txt(hist.texto, 1200) },
      mapa: sim(b.mapa, true),
      programacao: {
        ativo: sim(prog.ativo),
        itens: (Array.isArray(prog.itens) ? prog.itens : []).slice(0, 12)
          .map(i => ({ hora: hora(i?.hora), texto: txt(i?.texto, 80) })).filter(i => i.texto),
      },
      traje: { ativo: sim(traje.ativo), texto: txt(traje.texto, 300), cores: (Array.isArray(traje.cores) ? traje.cores : []).map(cor).filter(Boolean).slice(0, 5),
        evitar: (Array.isArray(traje.evitar) ? traje.evitar : []).map(cor).filter(Boolean).slice(0, 4) },
      presentes: {
        ativo: sim(pres.ativo),
        itens: (Array.isArray(pres.itens) ? pres.itens : []).map(i => txt(i, 80)).filter(Boolean).slice(0, 40),
        pix: txt(pres.pix, 120), tamanhos: txt(pres.tamanhos, 200), banco: txt(pres.banco, 300), link: url(pres.link), texto: txt(pres.texto, 300),
      },
      rsvp: {
        ativo: sim(rsvp.ativo, true), criancas: sim(rsvp.criancas, true), restricoes: sim(rsvp.restricoes),
        limite: Math.min(30, Math.max(1, parseInt(rsvp.limite, 10) || 10)), prazo: data(rsvp.prazo),
      },
      observacoes: { ativo: sim(obs.ativo), texto: txt(obs.texto, 500) },
    },
  };
}
