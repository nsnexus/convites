-- Pagamento por Pix pelo gateway NSNexus Pay
ALTER TABLE convites ADD COLUMN pix_txid TEXT;
ALTER TABLE convites ADD COLUMN pix_copia_cola TEXT;
ALTER TABLE convites ADD COLUMN pix_criado_em TEXT;
ALTER TABLE convites ADD COLUMN pix_verificado_em TEXT;
