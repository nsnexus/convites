-- Convites de casamento: vídeo com selo (iniciais do casal), categoria própria e restrições alimentares no RSVP
ALTER TABLE modelos ADD COLUMN tipo TEXT NOT NULL DEFAULT 'foto';
ALTER TABLE confirmacoes ADD COLUMN restricoes TEXT;
INSERT OR IGNORE INTO categorias (id, nome, ordem) VALUES ('casamento', 'Casamento', 0);
