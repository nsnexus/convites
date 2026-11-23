# NS Convites

Convites em vídeo com a foto do aniversariante encaixada na moldura final de cada modelo.
Site estático + Cloudflare Pages Functions + R2 (arquivos) + Supabase (dados).

## Como a foto entra no vídeo

Cada modelo termina numa moldura branca. Quando você envia um vídeo pelo admin, o navegador
acha essa moldura no último quadro e volta quadro a quadro acompanhando ela; onde ela some
é o momento em que a foto começa. As posições ficam salvas no Supabase (tabela `modelos`).

## Onde fica cada coisa

- **Cloudflare R2** (bucket `ns-convites`): fotos dos clientes (`fotos/`) e vídeos/capas dos
  modelos enviados pelo admin (`modelos/`). Servidos pelo próprio site em `/arquivos/...`.
  O R2 não cobra banda de saída e tem 10 GB grátis.
- **Supabase**: só dados (pedidos, confirmações, modelos, categorias, pedidos especiais).
- **Site (`public/modelos/`)**: os 17 vídeos iniciais.
No navegador, `public/assets/js/compositor.js` desenha o vídeo num canvas (WebGL) e
coloca a foto nos pixels brancos da moldura. Confete, pétalas e brilhos que passam
por cima continuam aparecendo na frente da foto.

Nada é renderizado no servidor: o convite é montado no celular do convidado, então
não há custo por convite nem fila de renderização.

## Estrutura

```
public/                 site (Cloudflare Pages)
  index.html            página de vendas + vitrine
  criar.html            montagem do convite (rota /criar)
  convite.html          convite do cliente (rota /c/<slug>)
  painel.html           confirmações de presença (rota /painel?c=<slug>&k=<token>)
  admin.html            sua área: pedidos, especiais, modelos, categorias (rota /admin)
  modelos/              os 17 vídeos iniciais e modelos.json (reserva se a API falhar)
  assets/js/config.js   WhatsApp, preços e URL do checkout
functions/api/          API (Pages Functions)
  convites/index.js     POST: cria pedido, salva a foto no R2
  convites/[slug].js    GET: dados do convite (só se pago)
  rsvp.js               POST: confirmação de presença
  painel.js             GET: lista de confirmações (com token)
  modelos.js            GET: vitrine (categorias e modelos ativos)
  especial/[token].js   GET: dados de um pedido especial
  admin/*               API do admin (exige login)
  pagamento/webhook.js  POST: marca convite como pago (ligar ao gateway da NSMusic)
functions/arquivos/    GET /arquivos/...: entrega arquivos do R2 (com Range para vídeo)
supabase/schema.sql     tabelas
supabase/seed_modelos.sql  cadastra as 4 categorias e os 17 modelos iniciais
tools/adicionar_modelo.py  alternativa por linha de comando (opcional)
```

## Subir pela primeira vez

1. **Supabase**: crie o projeto, abra o SQL Editor e rode `supabase/schema.sql` e depois `supabase/seed_modelos.sql`.
2. **Git**: crie o repositório no GitHub e envie este código:
   ```
   git remote add origin git@github.com:SEU-USUARIO/ns-convites.git
   git push -u origin main
   ```
3. **Cloudflare R2**: R2 → Create bucket → nome `ns-convites`.
4. **Cloudflare Pages**: Workers & Pages → Create → Pages → conectar ao repositório.
   - Build command: *(vazio)*
   - Output directory: `public`
   - Em Settings → Bindings: adicionar **R2 bucket**, nome da variável `ARQUIVOS`, bucket `ns-convites`.
5. Em Settings → Variables and Secrets do projeto:
   - `SUPABASE_URL` = `https://SEU-PROJETO.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = service role (secreta)
   - `WEBHOOK_SECRET` = qualquer texto longo (secreta)
   - `ADMIN_SENHA` = a senha para entrar em /admin (secreta)
   - `LIBERAR_SEM_PAGAMENTO` = `1` enquanto testa, `0` em produção
6. Edite `public/assets/js/config.js` com o número de WhatsApp e, quando estiver pronto,
   a URL do checkout (o id do pedido vai no final da URL).

Teste local: copie `.dev.vars.example` para `.dev.vars` e rode `npx wrangler pages dev public`.
Convite de demonstração, sem banco: `/c/exemplo`.

## Área do admin (/admin)

- **Pedidos**: todos os convites, com status, link do convite, link das confirmações e botão
  para mandar tudo ao cliente no WhatsApp. Pedido com música personalizada tem um campo
  para colar o link do MP3.
- **Especiais**: pedidos combinados por fora, com valor próprio e sem adicionais. Gera um link
  `/criar?pedido=...` para o cliente montar o convite; você pode prender um modelo
  (inclusive exclusivo) ou deixar o cliente escolher na vitrine.
- **Modelos**: envie um vídeo, confira a prévia com a foto e publique. Se a moldura não for
  achada, ajuste a sensibilidade ou marque a moldura arrastando sobre a prévia. Dá para
  esconder da vitrine, marcar como exclusivo, trocar nome e categoria.
- **Categorias**: criar, renomear, ordenar, esconder. Categoria sem modelo não aparece no site.

Requisitos do vídeo: vertical 9:16, 24 fps, terminando numa moldura **branca pura** parada
por pelo menos 2 segundos.

## Pagamento

O pedido é salvo como `aguardando_pagamento`. Quando o gateway confirmar, ele deve chamar
`POST /api/pagamento/webhook` com o header `x-webhook-secret` e o corpo
`{"referencia": "<id do convite>", "status": "pago"}`. Ajuste o arquivo ao formato real do
seu gateway.
