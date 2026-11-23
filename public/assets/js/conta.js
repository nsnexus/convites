const $ = id => document.getElementById(id);
const telas = ['telaEmail', 'telaCodigo', 'telaLista', 'telaConvite'];
const mostrar = t => { telas.forEach(x => $(x).hidden = x !== t); $('sair').hidden = !['telaLista', 'telaConvite'].includes(t); scrollTo(0, 0); };
const dataBR = d => new Date(`${d}T12:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
const NOME_ST = { aguardando_pagamento: 'Aguardando pagamento', pago: 'No ar', publicado: 'No ar', cancelado: 'Cancelado' };
let email = '';

async function api(caminho, opcoes = {}) {
  const r = await fetch(`/api/conta/${caminho}`, { method: opcoes.metodo || 'GET', headers: opcoes.corpo ? { 'content-type': 'application/json' } : {}, body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !['codigo', 'entrar'].includes(caminho)) { mostrar('telaEmail'); throw new Error(j.erro); }
  if (!r.ok) throw new Error(j.erro || 'Algo deu errado. Tente de novo.');
  return j;
}
const erro = (id, t) => { $(id).textContent = t; $(id).hidden = !t; };

$('formEmail').onsubmit = async e => {
  e.preventDefault(); erro('erroEmail', '');
  email = $('email').value.trim().toLowerCase();
  const bt = e.submitter; bt.disabled = true;
  try {
    await api('codigo', { metodo: 'POST', corpo: { email } });
    $('txtCodigo').textContent = `Se ${email} tiver pedidos com a gente, o código chega em instantes. Olhe também a caixa de spam.`;
    mostrar('telaCodigo'); $('codigo').focus();
  } catch (err) { erro('erroEmail', err.message); }
  bt.disabled = false;
};
$('outroEmail').onclick = () => { $('codigo').value = ''; mostrar('telaEmail'); };
$('formCodigo').onsubmit = async e => {
  e.preventDefault(); erro('erroCodigo', '');
  try { await api('entrar', { metodo: 'POST', corpo: { email, codigo: $('codigo').value } }); carregarLista(); }
  catch (err) { erro('erroCodigo', err.message); }
};
$('sair').onclick = async () => { await api('entrar', { metodo: 'DELETE' }).catch(() => {}); mostrar('telaEmail'); };

async function carregarLista() {
  const j = await api('convites');
  $('quem').textContent = j.cliente?.email || '';
  const l = $('lista'); l.textContent = '';
  if (!j.convites.length) l.innerHTML = '<p style="color:var(--tinta-2)">Você ainda não tem convites. <a href="/#modelos">Escolha um modelo</a> para começar.</p>';
  j.convites.forEach(c => {
    const b = document.createElement('button'); b.className = 'conv';
    b.innerHTML = `<img alt=""><div><h2></h2><div class="meta"></div><div class="num"></div></div>`;
    b.querySelector('img').src = c.poster || '';
    b.querySelector('h2').textContent = c.titulo || c.homenageado;
    const st = document.createElement('span'); st.className = `st st-${c.status}`; st.textContent = NOME_ST[c.status]; b.querySelector('h2').append(st);
    b.querySelector('.meta').textContent = `${dataBR(c.data)} às ${c.hora.replace(':', 'h')} · ${c.local}`;
    b.querySelector('.num').textContent = `${c.confirmados} ${c.confirmados == 1 ? 'pessoa confirmada' : 'pessoas confirmadas'}`;
    b.onclick = () => abrir(c.slug);
    l.append(b);
  });
  mostrar('telaLista');
}

let atual;
async function abrir(slug) {
  const j = await api(`convites?slug=${slug}`); atual = j.convite;
  const c = j.convite, l = j.confirmacoes, link = `${location.origin}/c/${c.slug}`;
  $('cTitulo').textContent = c.titulo || c.homenageado;
  $('nVao').textContent = l.filter(x => x.vai).reduce((s, x) => s + x.pessoas, 0);
  $('nResp').textContent = l.length; $('nNao').textContent = l.filter(x => !x.vai).length;
  const pronto = c.status === 'pago' || c.status === 'publicado';
  $('cAbrir').href = link; $('cAbrir').hidden = !pronto; $('cCopiar').hidden = !pronto; $('cZap').hidden = !pronto;
  $('cZap').href = `https://wa.me/?text=${encodeURIComponent(`Você está convidado! ${link}`)}`;
  $('cCopiar').onclick = () => navigator.clipboard.writeText(link).then(() => { $('cCopiar').textContent = 'Link copiado'; setTimeout(() => $('cCopiar').textContent = 'Copiar link', 2000); });
  const r = $('respostas'); r.textContent = '';
  if (!pronto) r.innerHTML = '<p style="color:var(--tinta-2)">O convite entra no ar assim que o pagamento for confirmado.</p>';
  else if (!l.length) r.innerHTML = '<p style="color:var(--tinta-2)">Ninguém respondeu ainda. Mande o link para os convidados.</p>';
  l.forEach(x => {
    const d = document.createElement('div'); d.className = 'resp';
    d.innerHTML = '<span class="s"></span><strong></strong><p></p>';
    d.querySelector('.s').className = `s ${x.vai ? 'sim' : 'nao'}`;
    d.querySelector('.s').textContent = x.vai ? `Vai · ${x.pessoas} ${x.pessoas > 1 ? 'pessoas' : 'pessoa'}` : 'Não vai';
    d.querySelector('strong').textContent = x.nome;
    d.querySelector('p').textContent = [x.presente && `Presente: ${x.presente}`, x.recado].filter(Boolean).join(' — ');
    r.append(d);
  });
  const f = $('formEditar');
  f.titulo.value = c.titulo || ''; f.data.value = c.data; f.hora.value = c.hora; f.local.value = c.local; f.endereco.value = c.endereco; f.recado.value = c.recado || '';
  erro('erroEditar', ''); $('okEditar').hidden = true;
  mostrar('telaConvite');
}
$('voltar').onclick = carregarLista;
$('formEditar').onsubmit = async e => {
  e.preventDefault(); erro('erroEditar', ''); $('okEditar').hidden = true;
  const f = e.target;
  try {
    await api('convites', { metodo: 'PATCH', corpo: { slug: atual.slug, titulo: f.titulo.value, data: f.data.value, hora: f.hora.value, local: f.local.value, endereco: f.endereco.value, recado: f.recado.value } });
    $('okEditar').hidden = false;
  } catch (err) { erro('erroEditar', err.message); }
};

// já logado? vai direto para a lista
carregarLista().catch(() => mostrar('telaEmail'));
