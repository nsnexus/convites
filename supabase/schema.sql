-- NS Convites: rode no SQL Editor do Supabase (pode rodar de novo sem problema).
-- Depois rode seed_modelos.sql uma vez para cadastrar os modelos iniciais.

create extension if not exists pgcrypto;

-- Categorias da vitrine
create table if not exists public.categorias (
  id text primary key,                 -- ex.: 'futebol'
  nome text not null,                  -- ex.: 'Futebol'
  ordem int not null default 0,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Modelos de vídeo
create table if not exists public.modelos (
  id text primary key,
  nome text not null,
  categoria_id text references public.categorias(id) on update cascade on delete set null,
  video_url text not null,
  poster_url text not null,
  fps int not null default 24,          -- quadros de rastreamento por segundo
  inicio int not null,                  -- quadro em que a foto começa a aparecer
  forma text not null default 'retangulo' check (forma in ('retangulo','circulo','mascara')),
  mascara_url text,
  chave boolean not null default true,  -- true: confete/pétalas ficam por cima da foto
  quadros jsonb not null,               -- [[x,y,w,h], ...] normalizados, um por quadro a partir de "inicio"
  ativo boolean not null default true,
  exclusivo boolean not null default false,  -- exclusivo: não aparece na vitrine
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists modelos_cat_idx on public.modelos(categoria_id);

-- Pedidos especiais: combinados por fora, com valor próprio (sem os adicionais padrão)
create table if not exists public.pedidos_especiais (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,           -- vai no link /criar?pedido=<token>
  cliente_nome text not null,
  cliente_whatsapp text,
  descricao text not null,
  valor_centavos int not null check (valor_centavos >= 0),
  modelo_id text references public.modelos(id) on delete set null,
  status text not null default 'aberto'
    check (status in ('aberto','aguardando_pagamento','pago','concluido','cancelado')),
  observacoes text,
  criado_em timestamptz not null default now()
);

-- Convites (pedidos)
create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  modelo text not null,
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento','pago','publicado','cancelado')),
  homenageado text not null,
  idade text,
  titulo text,
  data date not null,
  hora text not null,
  local text not null,
  endereco text not null,
  recado text,
  presentes text[] not null default '{}',
  foto_url text not null,
  ajuste jsonb not null default '{"zoom":1,"x":0.5,"y":0.5}',
  musica text not null default 'modelo' check (musica in ('modelo','personalizada')),
  musica_url text,
  cliente_nome text not null,
  cliente_whatsapp text not null,
  cliente_email text,
  valor_centavos int not null,
  token_painel text not null,
  pago_em timestamptz,
  criado_em timestamptz not null default now()
);
alter table public.convites add column if not exists tipo text not null default 'padrao';
alter table public.convites add column if not exists pedido_especial_id uuid references public.pedidos_especiais(id) on delete set null;
create index if not exists convites_status_idx on public.convites(status);

create table if not exists public.confirmacoes (
  id uuid primary key default gen_random_uuid(),
  convite_id uuid not null references public.convites(id) on delete cascade,
  nome text not null,
  vai boolean not null,
  pessoas int not null default 1,
  presente text,
  recado text,
  criado_em timestamptz not null default now()
);
create index if not exists confirmacoes_convite_idx on public.confirmacoes(convite_id);

-- RLS ligado e sem políticas: só o servidor (service role) lê e grava.
alter table public.categorias enable row level security;
alter table public.modelos enable row level security;
alter table public.pedidos_especiais enable row level security;
alter table public.convites enable row level security;
alter table public.confirmacoes enable row level security;

-- Buckets públicos (leitura pública, escrita só pelo servidor ou por link assinado)
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('modelos', 'modelos', true) on conflict (id) do nothing;
