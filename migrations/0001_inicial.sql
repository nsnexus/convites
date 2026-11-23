-- NS Convites: banco D1 (SQLite)

CREATE TABLE categorias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativa INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE modelos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria_id TEXT REFERENCES categorias(id) ON UPDATE CASCADE ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  fps INTEGER NOT NULL DEFAULT 24,
  inicio INTEGER NOT NULL,
  forma TEXT NOT NULL DEFAULT 'retangulo' CHECK (forma IN ('retangulo','circulo','mascara')),
  mascara_url TEXT,
  chave INTEGER NOT NULL DEFAULT 1,
  quadros TEXT NOT NULL,                 -- JSON [[x,y,w,h], ...]
  ativo INTEGER NOT NULL DEFAULT 1,
  exclusivo INTEGER NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX modelos_cat_idx ON modelos(categoria_id);

CREATE TABLE clientes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nome TEXT,
  whatsapp TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE codigos_login (
  email TEXT PRIMARY KEY,
  codigo_hash TEXT NOT NULL,
  expira INTEGER NOT NULL,               -- epoch ms
  tentativas INTEGER NOT NULL DEFAULT 0,
  criado INTEGER NOT NULL
);

CREATE TABLE pedidos_especiais (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  cliente_nome TEXT NOT NULL,
  cliente_whatsapp TEXT,
  cliente_email TEXT,
  descricao TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL CHECK (valor_centavos >= 0),
  modelo_id TEXT REFERENCES modelos(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','aguardando_pagamento','pago','concluido','cancelado')),
  observacoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE convites (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  cliente_id TEXT REFERENCES clientes(id),
  modelo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando_pagamento' CHECK (status IN ('aguardando_pagamento','pago','publicado','cancelado')),
  tipo TEXT NOT NULL DEFAULT 'padrao',
  pedido_especial_id TEXT REFERENCES pedidos_especiais(id) ON DELETE SET NULL,
  homenageado TEXT NOT NULL,
  idade TEXT,
  titulo TEXT,
  data TEXT NOT NULL,
  hora TEXT NOT NULL,
  local TEXT NOT NULL,
  endereco TEXT NOT NULL,
  recado TEXT,
  presentes TEXT NOT NULL DEFAULT '[]',  -- JSON
  foto_url TEXT NOT NULL,
  ajuste TEXT NOT NULL DEFAULT '{"zoom":1,"x":0.5,"y":0.5}',
  musica TEXT NOT NULL DEFAULT 'modelo' CHECK (musica IN ('modelo','personalizada')),
  musica_url TEXT,
  cliente_nome TEXT NOT NULL,
  cliente_whatsapp TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL,
  token_painel TEXT NOT NULL,
  pago_em TEXT,
  email_enviado_em TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX convites_status_idx ON convites(status);
CREATE INDEX convites_cliente_idx ON convites(cliente_id);

CREATE TABLE confirmacoes (
  id TEXT PRIMARY KEY,
  convite_id TEXT NOT NULL REFERENCES convites(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  vai INTEGER NOT NULL,
  pessoas INTEGER NOT NULL DEFAULT 1,
  presente TEXT,
  recado TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX confirmacoes_convite_idx ON confirmacoes(convite_id);
