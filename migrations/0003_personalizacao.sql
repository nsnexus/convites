-- Personalização do convite (estilo, cores, blocos) e confirmação com adultos/crianças
ALTER TABLE convites ADD COLUMN personalizacao TEXT NOT NULL DEFAULT '{}';
ALTER TABLE confirmacoes ADD COLUMN adultos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE confirmacoes ADD COLUMN criancas INTEGER NOT NULL DEFAULT 0;
UPDATE confirmacoes SET adultos = pessoas WHERE vai = 1;
