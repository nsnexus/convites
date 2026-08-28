# NSConvites

Plataforma de casamento (site do casal, convites digitais, RSVP, lista de
presentes e marketplace de fornecedores). Stack: Next.js 16 (App Router) +
Firebase. O plano completo de produto e arquitetura está no artefato
publicado na conversa — este README cobre o setup e o estado real do código.

## O que já funciona (testado nos emuladores, ponta a ponta)

- **Contas**: cadastro/login por e-mail+senha e Google, sessão em cookie httpOnly.
- **Site do casal**: 4 templates, seções ligáveis, conteúdo editável, publicar/despublicar, ISR.
- **Convidados**: adicionar, colar lista (CSV informal), link de convite assinado, botão "Compartilhar" que abre o WhatsApp do navegador (`wa.me`) — nenhuma API paga.
- **RSVP público**: sem conta, via token no link; grava confirmação, recado e atualiza os contadores do casal.
- **Lista de presentes**: catálogo (simbólico/cotas/valor livre), checkout, Pix "copia e cola", carteira (disponível/em processamento/sacado/bloqueado), saque, extrato.
- **Checklist e orçamento**: CRUD simples.
- **Marketplace**: cadastro de fornecedor, aprovação no backoffice (`/admin`), busca por categoria×cidade (landing de SEO), perfil público, envio de lead com contato mascarado até o fornecedor responder.

## O que é simulado de propósito (fase 2 do plano)

Não existe gateway de pagamento real conectado — **nenhuma cobrança de verdade acontece**.
`src/server/payments/dev-provider.ts` gera um Pix de mentira; a tela do pedido
tem um botão "Simular pagamento" que chama `POST /api/dev/simulate-payment/[orderId]`,
o qual roda a **mesma** função (`confirmOrderPaid`) que um webhook real do
Pagar.me chamaria. Trocar para o gateway real é implementar
`src/server/payments/pagarme-provider.ts` (já esqueletado) — o resto do fluxo
(reserva de cota, ledger, carteira, saque) não muda.

## O que exige credenciais suas (não dá para provisionar por código)

- **Projeto Firebase real** (console.firebase.google.com) — para sair do emulador.
- **Conta no gateway de pagamento** (Pagar.me ou similar) com CNPJ e KYC — para receber dinheiro de verdade.
- **Domínio próprio**, se quiser sair de um subdomínio.

## Setup local

1. **Instalar dependências**

   ```bash
   npm install
   npm --prefix functions install
   ```

2. **Java 21+** — os emuladores de Firestore/Storage exigem. Confira com `java -version`;
   se for menor que 21, instale o Temurin 21 (`winget install EclipseAdoptium.Temurin.21.JDK`).

3. **Variáveis de ambiente**

   ```bash
   cp .env.local.example .env.local
   ```

   Para rodar só nos emuladores, os valores podem ser fictícios — só precisam
   existir (o schema em `src/lib/env.ts`/`env.server.ts` valida presença, não
   autenticidade). `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` já direciona tudo
   para local. Para produção, preencha com as chaves reais do projeto Firebase
   (Configurações do projeto → Geral para o client SDK; Contas de serviço →
   Gerar nova chave privada para o Admin SDK).

4. **Subir os emuladores** (Auth, Firestore, Storage — UI em `http://localhost:4000`)

   ```bash
   npm run emulators
   ```

5. **Rodar o Next.js**, em outro terminal

   ```bash
   npm run dev
   ```

   App em `http://localhost:3000`. Fluxo pra testar tudo: `/cadastro` → criar
   casamento em `/painel` → `/painel/[id]/convidados` (adicionar convidado) →
   `/painel/[id]/site` (marcar seções, publicar) → `/painel/[id]/presentes`
   (cadastrar um presente) → abrir `/c/[slug]`, confirmar RSVP pelo link do
   convidado, presentear e clicar em "Simular pagamento".

## Cloud Functions

```bash
npm run functions:build      # compila TypeScript -> functions/lib
npm run functions:deploy     # deploy real (não roda no emulador)
```

`npm run emulators` já builda e serve as functions localmente. Duas funções
agendadas: `dailyReminderSweep` (stub, fase 1) e `releaseExpiredGiftHolds`
(libera cotas de presente reservadas por pedido nunca pago, a cada 5 min).

## Estrutura

```
src/
  app/
    (public)/c/[slug]/          site do casal — SSR + Admin SDK + ISR
    (public)/c/[slug]/presentear/[giftId]/(pedido/[orderId])  checkout de presente
    (public)/fornecedores/...   marketplace — busca e landing de SEO
    (public)/v/[slug]/          perfil público do fornecedor + lead
    (couple)/painel/[coupleId]/ site, convidados, presentes, checklist, orçamento
    (vendor)/fornecedor/        cadastro, dashboard de leads, perfil
    (admin)/admin/              moderação de fornecedores
    api/auth/session/           troca ID token por cookie de sessão httpOnly
    api/webhooks/[provider]/    webhooks de pagamento (fase 2, contrato pronto)
    api/dev/simulate-payment/   só em dev — dispara confirmOrderPaid manualmente
  server/
    repositories/                único lugar que fala com o Firestore
    auth/                        sessão, guards de autorização, token de convite (HMAC)
    payments/                    provider.ts (contrato), dev-provider.ts, pagarme-provider.ts (stub), confirm-order.ts
  lib/
    firebase-client.ts / firebase-admin.ts
    env.ts / env.server.ts       validação de variáveis de ambiente com zod
    schemas/                     validação de input com zod
functions/                       Cloud Functions v2
firestore.rules / firestore.indexes.json / storage.rules
```

**Regra que vale para todo código novo**: nenhum componente ou route handler
importa `firebase-admin` diretamente — sempre por um repositório em
`src/server/repositories`. Isso é o que mantém a porta aberta para migrar o
financeiro para Postgres mais tarde sem reescrever a aplicação.

## Próximos passos reais

- Ligar `PagarmeProvider` (ou equivalente) quando houver conta no gateway.
- Página de importação de convidados por upload de arquivo `.csv` (hoje é por colagem de texto).
- Templates de site com upload de foto (galeria) — Storage já tem regra pronta, falta a tela.
- Busca com Typesense/Algolia quando o catálogo de fornecedores crescer (hoje é filtro direto no Firestore, que aguenta bem o volume de uma praça só).
