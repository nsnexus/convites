# NS Convites

Convites em vídeo com a foto do aniversariante encaixada na moldura final de cada modelo.
Roda 100% na Cloudflare: **Pages** (site + API), **D1** (banco), **R2** (fotos e vídeos).
E-mails pelo **Resend**.

## Como a foto entra no vídeo

Cada modelo termina numa moldura branca. Quando você envia um vídeo pelo admin, o navegador
acha essa moldura no último quadro e volta quadro a quadro acompanhando ela; onde ela some
é o momento em que a foto começa. As posições ficam salvas no D1 (tabela `modelos`).
No convite, `public/assets/js/compositor.js` desenha o vídeo num canvas (WebGL) e coloca a foto
nos pixels brancos da moldura; confete e pétalas continuam passando na frente.

## Fluxo do cliente

1. Escolhe o modelo, envia a foto, preenche a festa e o e-mail (`/criar`).
2. Vai para o checkout. O gateway devolve para `/obrigado?pedido=<id>`, que espera a confirmação
   e mostra o link do convite na hora.
3. O gateway chama `POST /api/pagamento/webhook`: o convite entra no ar e o cliente recebe
   um e-mail com o link.
4. Em `/conta` o cliente entra com o e-mail (recebe um código de 6 dígitos, sem senha), vê os
   convites, quem confirmou presença, e corrige data, horário ou endereço.

## Estrutura

```
public/                 site
  index.html            página de vendas + vitrine
  criar.html            montagem do convite (/criar, aceita ?modelo= e ?pedido=)
  obrigado.html         retorno do checkout (/obrigado?pedido=)
  convite.html          convite (/c/<slug>)
  conta.html            Meus convites, login por código no e-mail (/conta)
  admin.html            sua área (/admin)
  painel.html           confirmações por link direto (/painel?c=&k=)
  modelos/              os 17 vídeos iniciais (+ modelos.json, reserva se a API cair)
functions/
  _lib/                 banco, sessões, e-mail, arquivos, confirmação de pagamento
  api/                  API pública, conta do cliente e admin
  arquivos/             GET /arquivos/... entrega fotos e vídeos do R2
migrations/             tabelas do D1 + os 17 modelos iniciais
```

## Colocar no ar

Pelo terminal, com `npx wrangler login` feito:

```bash
npx wrangler d1 create ns-convites          # copie o database_id para o wrangler.toml
npx wrangler d1 migrations apply ns-convites --remote
npx wrangler r2 bucket create ns-convites
```

No painel da Cloudflare: Workers & Pages → Create → Pages → conectar ao repositório
`nsnexus/convites`, branch `master`, build command vazio, output `public`.
Os bindings `DB` (D1) e `ARQUIVOS` (R2) vêm do `wrangler.toml`.

Em Settings → Variables and Secrets:

| Nome | Tipo | Valor |
|---|---|---|
| `SEGREDO` | secreta | texto longo e aleatório (assina os logins) |
| `ADMIN_SENHA` | secreta | sua senha do /admin |
| `RESEND_API_KEY` | secreta | chave do Resend |
| `WEBHOOK_SECRET` | secreta | combinado com o gateway |
| `EMAIL_REMETENTE` | texto | `NS Convites <convites@seudominio.com.br>` |
| `SITE_URL` | texto | `https://seudominio.com.br` |
| `LIBERAR_SEM_PAGAMENTO` | texto | `1` para testar sem checkout, `0` em produção |

Depois edite `public/assets/js/config.js` (WhatsApp de atendimento e URL do checkout).

### Teste local

```bash
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply ns-convites --local
npx wrangler pages dev public
```
Sem `RESEND_API_KEY`, os e-mails (inclusive o código de login) aparecem no terminal.

## Área do admin (/admin)

- **Pedidos**: status, links, reenviar e-mail. Marcar como **Pago** libera o convite e manda o e-mail.
- **Especiais**: pedidos com valor fechado fora da tabela. Gera o link `/criar?pedido=...`.
- **Modelos**: envie um vídeo, confira a prévia e publique. Se a moldura não for achada, ajuste
  a sensibilidade ou marque com o dedo. Exclusivo = não aparece na vitrine.
- **Categorias**: criar, renomear, ordenar, esconder.

Requisitos do vídeo: vertical 9:16, terminando numa moldura **branca** parada por ~2 segundos.
Prefira 720p (2 a 3 MB): abre mais rápido no celular dos convidados.

## Pagamento

O webhook espera o header `x-webhook-secret` e o corpo
`{"referencia": "<id do convite>", "status": "pago"}`. Ajuste
`functions/api/pagamento/webhook.js` ao formato real do seu gateway.
